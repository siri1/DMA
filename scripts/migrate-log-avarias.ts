/**
 * Migração do Log de Avarias (Excel → PostgreSQL)
 *
 * Lê a folha "Log de avarias" do ficheiro XLSX fornecido pelo cliente
 * (colunas: Asset, Descrição, Marca, Modelo, Número de Série,
 * Data de Entrada, Diagnóstico, Status) e cria:
 *   - um Asset por código de equipamento único (a primeira vez que aparece)
 *   - uma WorkOrder histórica (origin=AVARIA) por cada linha do log
 *
 * Uso:
 *   npx tsx scripts/migrate-log-avarias.ts --dry-run
 *   npx tsx scripts/migrate-log-avarias.ts
 *   npx tsx scripts/migrate-log-avarias.ts --file "outro-ficheiro.xlsx"
 *
 * Idempotente: assets já existentes (por assetCode) não são recriados;
 * work orders já migradas (mesmo assetId + openedAt + summary) não são
 * duplicadas — pode re-executar em segurança.
 */
import { PrismaClient, type AssetStatus, type WorkOrderStatus } from '@prisma/client'
import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const HEADER_ROW = 2
const FIRST_DATA_ROW = 3

interface ParsedRow {
  rowNumber: number
  assetCode: string
  description: string
  brand?: string
  model?: string
  serialNumber?: string
  entryDate: Date
  diagnosis?: string
  statusRaw: string
}

interface RejectedRow {
  row: number
  reason: string
}

// Estados do log antigo (coluna "Status") → WorkOrderStatus da máquina de estados
const STATUS_MAPPING: Record<string, WorkOrderStatus> = {
  resolvido: 'RESOLVIDA',
  'em curso': 'EM_CURSO',
  cancelado: 'CANCELADA',
  pendente: 'PENDENTE',
}

function normalizeStatus(raw: string): string {
  return raw.trim().toLowerCase()
}

function parseCellDate(value: unknown): Date | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    // aceita dd/mm/aaaa como fallback, além do formato ISO que o exceljs já entrega
    const isoTry = new Date(value)
    if (!isNaN(isoTry.getTime())) return isoTry
    const [day, month, year] = value.split('/').map(Number)
    if (day && month && year) {
      const d = new Date(year, month - 1, day)
      return isNaN(d.getTime()) ? null : d
    }
  }
  return null
}

async function readWorkbook(filePath: string): Promise<ParsedRow[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  const sheet = wb.worksheets[0]
  if (!sheet) throw new Error('Ficheiro sem folhas de cálculo')

  const header = sheet.getRow(HEADER_ROW).values as unknown[]
  const expectedCols = ['Asset', 'Descrição', 'Marca', 'Modelo', 'Número de Série', 'Data de Entrada', 'Diagnóstico', 'Status']
  const actualCols = expectedCols.map((_, i) => String(header[i + 1] ?? '').trim())
  const mismatch = expectedCols.some((c, i) => actualCols[i] !== c)
  if (mismatch) {
    console.warn('⚠️  Aviso: cabeçalhos da folha diferem do esperado.')
    console.warn(`   Esperado: ${expectedCols.join(' | ')}`)
    console.warn(`   Encontrado: ${actualCols.join(' | ')}`)
  }

  const rows: ParsedRow[] = []
  for (let r = FIRST_DATA_ROW; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r)
    const assetCode = row.getCell(1).value
    if (assetCode === null || assetCode === undefined || String(assetCode).trim() === '') continue

    rows.push({
      rowNumber: r,
      assetCode: String(assetCode).trim(),
      description: String(row.getCell(2).value ?? '').trim(),
      brand: row.getCell(3).value ? String(row.getCell(3).value).trim() : undefined,
      model: row.getCell(4).value ? String(row.getCell(4).value).trim() : undefined,
      serialNumber: row.getCell(5).value ? String(row.getCell(5).value).trim() : undefined,
      entryDate: parseCellDate(row.getCell(6).value) as Date, // validado a seguir
      diagnosis: row.getCell(7).value ? String(row.getCell(7).value).trim() : undefined,
      statusRaw: String(row.getCell(8).value ?? '').trim(),
    })
  }
  return rows
}

async function migrate(filePath: string, dryRun: boolean) {
  const report = {
    totalRead: 0,
    assetsCreated: 0,
    assetsSkippedExisting: 0,
    workOrdersCreated: 0,
    workOrdersSkippedExisting: 0,
    rejected: [] as RejectedRow[],
  }

  const rawRows = await readWorkbook(filePath)
  report.totalRead = rawRows.length

  // Valida cada linha; separa boas de rejeitadas
  const validRows: ParsedRow[] = []
  for (const row of rawRows) {
    if (!row.assetCode || !row.description) {
      report.rejected.push({ row: row.rowNumber, reason: 'Código de equipamento ou descrição em falta' })
      continue
    }
    if (!row.entryDate || isNaN(row.entryDate.getTime())) {
      report.rejected.push({ row: row.rowNumber, reason: `Data de entrada inválida` })
      continue
    }
    const statusKey = normalizeStatus(row.statusRaw)
    if (!STATUS_MAPPING[statusKey]) {
      report.rejected.push({ row: row.rowNumber, reason: `Estado desconhecido: "${row.statusRaw}"` })
      continue
    }
    validRows.push(row)
  }

  // Ordena por data de entrada para numeração de OT cronológica e para
  // apurar corretamente qual é a entrada "mais recente" de cada asset.
  validRows.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime())

  // Agrupa por assetCode: primeira ocorrência define entryDate do Asset;
  // última ocorrência define o estado/diagnóstico actual do Asset.
  const byAsset = new Map<string, ParsedRow[]>()
  for (const row of validRows) {
    const list = byAsset.get(row.assetCode) ?? []
    list.push(row)
    byAsset.set(row.assetCode, list)
  }

  const assetIdByCode = new Map<string, string>()

  for (const [assetCode, rows] of byAsset) {
    const first = rows[0]
    const last = rows[rows.length - 1]

    const existing = await prisma.asset.findUnique({ where: { assetCode } })
    if (existing) {
      report.assetsSkippedExisting++
      assetIdByCode.set(assetCode, existing.id)
      continue
    }

    const lastStatusKey = normalizeStatus(last.statusRaw)
    const derivedStatus: AssetStatus =
      lastStatusKey === 'em curso' || lastStatusKey === 'pendente' ? 'EM_MANUTENCAO' : 'EM_OPERACAO'

    if (!dryRun) {
      const asset = await prisma.asset.create({
        data: {
          assetCode,
          description: first.description,
          brand: first.brand,
          model: first.model,
          serialNumber: first.serialNumber,
          entryDate: first.entryDate,
          diagnosis: last.diagnosis,
          status: derivedStatus,
        },
      })
      assetIdByCode.set(assetCode, asset.id)
    } else {
      assetIdByCode.set(assetCode, `dry-run:${assetCode}`)
    }
    report.assetsCreated++
  }

  // Numeração sequencial de OT histórica para o(s) ano(s) presentes nos dados
  const nextNumberByYear = new Map<number, number>()
  if (!dryRun) {
    const years = [...new Set(validRows.map((r) => r.entryDate.getFullYear()))]
    for (const year of years) {
      const lastWO = await prisma.workOrder.findFirst({
        where: { number: { startsWith: `OT-${year}-` } },
        orderBy: { number: 'desc' },
      })
      let next = 1
      if (lastWO) {
        const match = lastWO.number.match(/OT-\d+-(\d+)/)
        if (match) next = parseInt(match[1], 10) + 1
      }
      nextNumberByYear.set(year, next)
    }
  }

  for (const row of validRows) {
    const assetId = assetIdByCode.get(row.assetCode)
    if (!assetId) continue // asset foi rejeitado (não deveria acontecer, mas por segurança)

    const status = STATUS_MAPPING[normalizeStatus(row.statusRaw)]
    const summary = row.diagnosis || row.description

    // Verifica duplicados em ambos os modos (mesmo em dry-run, desde que o
    // asset já exista de verdade) para que o relatório reflita com precisão
    // o que aconteceria mesmo depois de uma execução real anterior.
    const isRealAssetId = !assetId.startsWith('dry-run:')
    const duplicate = isRealAssetId
      ? await prisma.workOrder.findFirst({ where: { assetId, openedAt: row.entryDate, summary } })
      : null
    if (duplicate) {
      report.workOrdersSkippedExisting++
      continue
    }

    if (!dryRun) {
      const year = row.entryDate.getFullYear()
      const num = nextNumberByYear.get(year) ?? 1
      nextNumberByYear.set(year, num + 1)
      const number = `OT-${year}-${String(num).padStart(4, '0')}`

      await prisma.workOrder.create({
        data: {
          number,
          assetId,
          origin: 'AVARIA',
          priority: 'MEDIA', // sem dados de prioridade na origem — ver docs/ASSUMPTIONS.md
          status,
          openedAt: row.entryDate,
          closedAt: status === 'RESOLVIDA' || status === 'CANCELADA' ? row.entryDate : null,
          summary,
        },
      })
      report.workOrdersCreated++
    } else {
      report.workOrdersCreated++
    }
  }

  return report
}

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const fileFlagIndex = args.indexOf('--file')
  const filePath =
    fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : 'data/Kwanda_Log de avarias na oficina.xlsx'
  const resolvedPath = path.resolve(process.cwd(), filePath)

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Ficheiro não encontrado: ${resolvedPath}`)
    console.error('   Use --file "<caminho>" para indicar a localização correta.')
    process.exit(1)
  }

  console.log(`\n📋 Migração do Log de Avarias (${isDryRun ? 'DRY-RUN' : 'EXECUÇÃO'})`)
  console.log(`   Ficheiro: ${resolvedPath}`)
  console.log('━'.repeat(60))

  const report = await migrate(resolvedPath, isDryRun)

  console.log(`\n✅ Relatório de Migração:`)
  console.log(`  Linhas lidas:                ${report.totalRead}`)
  console.log(`  Equipamentos criados:        ${report.assetsCreated}`)
  console.log(`  Equipamentos já existentes:  ${report.assetsSkippedExisting}`)
  console.log(`  Ordens de trabalho criadas:  ${report.workOrdersCreated}`)
  console.log(`  Ordens já existentes:        ${report.workOrdersSkippedExisting}`)
  console.log(`  Linhas rejeitadas:           ${report.rejected.length}`)

  if (report.rejected.length > 0) {
    console.log(`\n⚠️  Linhas rejeitadas:`)
    report.rejected.forEach((e) => console.log(`  Linha ${e.row}: ${e.reason}`))
  }

  const reportPath = 'docs/migration-report.md'
  const reportContent = `# Relatório de Migração — Log de Avarias

Data: ${new Date().toISOString()}
Modo: ${isDryRun ? 'Dry-run (nenhuma alteração)' : 'Execução'}
Ficheiro de origem: ${path.basename(resolvedPath)}

## Resumo

- **Linhas lidas:** ${report.totalRead}
- **Equipamentos criados:** ${report.assetsCreated}
- **Equipamentos já existentes (ignorados):** ${report.assetsSkippedExisting}
- **Ordens de trabalho criadas:** ${report.workOrdersCreated}
- **Ordens de trabalho já existentes (ignoradas):** ${report.workOrdersSkippedExisting}
- **Linhas rejeitadas:** ${report.rejected.length}

## Mapeamento de estados aplicado

| Estado no Excel | WorkOrderStatus |
|---|---|
| Resolvido | RESOLVIDA |
| Em curso | EM_CURSO |
| Cancelado | CANCELADA |
| Pendente | PENDENTE |

O estado do **Asset** (equipamento) é derivado do estado da entrada mais
recente desse equipamento no log: \`EM_MANUTENCAO\` se "Em curso"/"Pendente",
\`EM_OPERACAO\` caso contrário.

## Linhas Rejeitadas

${
  report.rejected.length > 0
    ? report.rejected.map((e) => `- Linha ${e.row}: ${e.reason}`).join('\n')
    : 'Nenhuma linha rejeitada.'
}

---

Idempotente: sim. Assets existentes (por \`assetCode\`) e ordens de trabalho
já migradas (mesmo equipamento + data de abertura + resumo) não são
duplicados numa nova execução.
`

  fs.writeFileSync(reportPath, reportContent)
  console.log(`\n📄 Relatório guardado em: ${reportPath}`)

  if (isDryRun) {
    console.log('\n✅ Modo dry-run — nenhuma alteração foi feita na base de dados.')
  }
}

main()
  .catch((err) => {
    console.error('Erro na migração:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
