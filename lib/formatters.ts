/**
 * Data vinda de uma API (fetch().then(r => r.json())) chega sempre como
 * string ISO, nunca como Date - JSON não tem tipo de data. O tipo Prisma
 * (Date) só é verdade no servidor; no cliente é sempre string. Aceitar
 * ambos aqui evita ter de normalizar em cada local que chama formatDate.
 */
function toDate(value: Date | string): Date | null {
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = toDate(date)
  if (!d) return ''
  return d.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = toDate(date)
  if (!d) return ''
  return d.toLocaleString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatCurrency(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined) return '0,00 Kz'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' Kz'
}

export function formatNumber(
  amount: number | null | undefined,
  decimals = 0
): string {
  if (amount === null || amount === undefined) return '0'
  return amount.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function getTimeZone(): string {
  return process.env.TIMEZONE || 'Africa/Luanda'
}
