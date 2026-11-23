export function isCalendarDate(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function seoulDateKey(now = new Date()): string {
  const date = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

export function offsetDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'UTC', month: 'numeric', day: 'numeric', weekday: 'short' })
    .format(new Date(`${date}T00:00:00Z`))
}

export function currentWeek(today: string): string[] {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay()
  const monday = offsetDate(today, -(weekday === 0 ? 6 : weekday - 1))
  return Array.from({ length: 7 }, (_, index) => offsetDate(monday, index))
}
