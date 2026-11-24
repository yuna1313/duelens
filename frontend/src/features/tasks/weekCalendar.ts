import { currentWeek, isCalendarDate, offsetDate } from '../../utils/date.ts'
import { isTerm } from '../../domain/academicTerm.ts'
import type { TaskPreview } from './model.ts'

export function scheduleReferenceDate(term: string, today: string, tasks: TaskPreview[]): string {
  if (!isTerm(term)) return today
  const [yearText, semester] = term.split('-')
  const year = Number(yearText)
  const todayYear = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7))
  // Display suggestions only. They do not define the school's calendar or limit deadlines.
  const sameYear = todayYear === year
  const nextWinter = todayYear === year + 1 && month <= 2
  const inSeason = semester === '1' ? sameYear && month >= 3 && month <= 8
    : semester === 'summer' ? sameYear && month >= 6 && month <= 8
    : semester === '2' ? (sameYear && month >= 9) || nextWinter
    : (sameYear && month === 12) || nextWinter
  if (inSeason) return today
  const datedTasks = tasks.filter(task => task.term === term && task.dueDate && isCalendarDate(task.dueDate))
  const remaining = datedTasks.filter(task => task.status !== 'submitted')
  const dates = (remaining.length ? remaining : datedTasks)
    .map(task => task.dueDate!).sort()
  if (dates.length) return dates.find(date => date >= today) ?? dates[dates.length - 1]
  const startMonth = semester === '1' ? '03' : semester === 'summer' ? '06' : semester === '2' ? '09' : '12'
  const first = `${yearText}-${startMonth}-01`
  const monday = currentWeek(first)[0]
  return monday < first ? offsetDate(monday, 7) : monday
}

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
