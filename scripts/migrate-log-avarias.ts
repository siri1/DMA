import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

interface LogAvariaRow {
  assetCode: string
  description: string
  brand?: string
  model?: string
  serialNumber?: string
  entryDate: string // dd/mm/aaaa
  diagnosis?: string
  status?: string // estado antigo
}

// Mapeamento de estados antigos para novos
const stateMapping: Record<string, string> = {
  'em operação': 'EM_OPERACAO',
  'em manutenção': 'EM_MANUTENCAO',
  'indisponível': 'INDISPONIVEL',
  'fora de serviço': 'FORA_DE_SERVICO',
  'quarentena': 'QUARENTENA',
  'abatido': 'ABATIDO',
  'operacional': 'EM_OPERACAO',
  'em reparação': 'EM_MANUTENCAO',
}

function parseDate(dateStr: string): Date | null {
  const [day, month, year] = dateStr.split('/').map(Number)
  if (!day || !month || !year) return null
  const date = new Date(year, month - 1, day)
  return isNaN(date.getTime()) ? null : date
}

async function migrateLogs(dryRun = false) {
  const report = {
    totalRead: 0,
    created: 0,
    skipped: 0,
    errors: [] as Array<{ row: number; reason: string }>,
  }

  // Simular leitura de XLSX (por ora, dados hardcoded)
  const sampleData: LogAvariaRow[] = [
    {
      assetCode: 'EMPI-001',
      description: 'Empilhador Frontal Toyota 3.0T',
      brand: 'Toyota',
      model: '8FGU30',
      serialNumber: 'BF0328742',
      entryDate: '15/06/2022',
      diagnosis: 'Operacional',
      status: 'em operação',
    },
    {
      assetCode: 'GERA-001',
      description: 'Gerador Diesel Perkins 150kVA',
      brand: 'Perkins',
      model: '1106-70TG1',
      serialNumber: 'PK987654',
      entryDate: '20/03/2021',
      diagnosis: 'Requer manutenção preventiva',
      status: 'em manutenção',
    },
    {
      assetCode: 'COMP-001',
      description: 'Compressor Parafuso Atlas Copco 30kW',
      brand: 'Atlas Copco',
      model: 'GA30VSD+',
      serialNumber: 'AC45123456',
      entryDate: '10/09/2020',
      diagnosis: 'Em manutenção',
      status: 'indisponível',
    },
  ]

  for (let i = 0; i < sampleData.length; i++) {
    const row = sampleData[i]
    report.totalRead++

    try {
      // Validações
      if (!row.assetCode || !row.description) {
        report.errors.push({
          row: i + 1,
          reason: 'Código ou descrição faltando',
        })
        report.skipped++
        continue
      }

      const entryDate = parseDate(row.entryDate)
      if (!entryDate) {
        report.errors.push({
          row: i + 1,
          reason: `Data inválida: ${row.entryDate}`,
        })
        report.skipped++
        continue
      }

      // Verificar duplicata
      const existing = await prisma.asset.findUnique({
        where: { assetCode: row.assetCode },
      })
      if (existing) {
        report.skipped++
        continue
      }

      // Mapear estado
      const newStatus =
        stateMapping[row.status?.toLowerCase() || ''] || 'EM_OPERACAO'

      if (!dryRun) {
        await prisma.asset.create({
          data: {
            assetCode: row.assetCode,
            description: row.description,
            brand: row.brand,
            model: row.model,
            serialNumber: row.serialNumber,
            entryDate,
            diagnosis: row.diagnosis,
            status: newStatus as any,
          },
        })
      }

      report.created++
    } catch (error) {
      report.errors.push({
        row: i + 1,
        reason: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      report.skipped++
    }
  }

  return report
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  console.log(`\n📋 Migração do Log de Avarias (${isDryRun ? 'DRY-RUN' : 'EXECUÇÃO'})`)
  console.log('━'.repeat(60))

  const report = await migrateLogs(isDryRun)

  console.log(`\n✅ Relatório de Migração:`)
  console.log(`  Linhas lidas:    ${report.totalRead}`)
  console.log(`  Criadas:         ${report.created}`)
  console.log(`  Ignoradas:       ${report.skipped}`)
  console.log(`  Erros:           ${report.errors.length}`)

  if (report.errors.length > 0) {
    console.log(`\n⚠️  Erros encontrados:`)
    report.errors.forEach((e) => {
      console.log(`  Linha ${e.row}: ${e.reason}`)
    })
  }

  // Guardar relatório
  const reportPath = 'docs/migration-report.md'
  const reportContent = `# Relatório de Migração — Log de Avarias

Data: ${new Date().toISOString()}
Modo: ${isDryRun ? 'Dry-run' : 'Execução'}

## Resumo

- **Linhas lidas:** ${report.totalRead}
- **Equipamentos criados:** ${report.created}
- **Linhas ignoradas:** ${report.skipped}
- **Erros:** ${report.errors.length}

## Detalhes de Erros

${
  report.errors.length > 0
    ? report.errors.map((e) => `- Linha ${e.row}: ${e.reason}`).join('\n')
    : 'Nenhum erro.'
}

---

Idempotente? Sim. Pode re-executar sem duplicar.
`

  fs.writeFileSync(reportPath, reportContent)
  console.log(`\n📄 Relatório guardado em: ${reportPath}`)

  if (isDryRun) {
    console.log('\n✅ Modo dry-run — nenhuma alteração foi feita.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
