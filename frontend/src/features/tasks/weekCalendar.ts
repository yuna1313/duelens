import { isCalendarDate } from '../../utils/date.ts'

export function adjacentMonth(date: string, direction: -1 | 1): string | null {
  const first = new Date(`${date.slice(0, 7)}-01T00:00:00Z`)
  first.setUTCMonth(first.getUTCMonth() + direction)
  const result = first.toISOString().slice(0, 10)
  return isCalendarDate(result) ? result : null
}

export function monthCalendar(date: string): string[] {
  const first = `${date.slice(0, 7)}-01`
  const last = new Date(`${first}T00:00:00Z`)
  last.setUTCMonth(last.getUTCMonth() + 1, 0)
  const leading = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7
  const count = Math.ceil((leading + last.getUTCDate()) / 7) * 7
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(`${first}T00:00:00Z`)
    day.setUTCDate(index - leading + 1)
    return day.toISOString().split('T')[0]
  })
}
