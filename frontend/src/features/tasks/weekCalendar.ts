import { currentWeek, isCalendarDate } from '../../utils/date.ts'
import type { TaskPreview } from './model.ts'

export function scheduleTasks(tasks: TaskPreview[], date: string, selectedDay: string | null = null): TaskPreview[] {
  const week = currentWeek(date)
  return tasks.filter(task => task.status !== 'submitted' && task.dueDate && week.includes(task.dueDate) && (!selectedDay || task.dueDate === selectedDay))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99'))
}

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
