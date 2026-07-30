export function brl(value: number | null | undefined): string {
  const n = typeof value === 'number' && isFinite(value) ? value : 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function num(value: number | null | undefined): string {
  const n = typeof value === 'number' && isFinite(value) ? value : 0
  // Trim trailing zeros: 12.0 -> "12", 12.5 -> "12,5"
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

export function dateBR(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export function dateTimeBR(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
