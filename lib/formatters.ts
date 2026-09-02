export function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return ''
  return date.toLocaleString('pt-PT', {
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
