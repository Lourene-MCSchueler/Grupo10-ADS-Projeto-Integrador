function pad(value) {
  return String(value).padStart(2, '0')
}

// Data local (toISOString usa UTC e vira o dia depois das 21h no Brasil).
export function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function currentMonth() {
  return todayISO().slice(0, 7)
}

export function formatDate(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

export function formatShortDate(value) {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function formatWeekday(value) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(new Date(`${value}T12:00:00`))
    .replace('.', '')
}

export function formatMonth(value) {
  if (!value) return ''

  const text = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(`${value}-15T12:00:00`),
  )
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// "2026-11-23T08:00" → "08:00"
export function formatTime(value) {
  return value?.slice(11, 16) || '--:--'
}

// "2026-11-23 14:05:10" (SQLite) → "23/11/2026 14:05"
export function formatDateTime(value) {
  if (!value) return '—'
  return `${formatShortDate(value)} ${value.slice(11, 16)}`
}
