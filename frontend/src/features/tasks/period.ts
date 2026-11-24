import { currentWeek } from '../../utils/date.ts'
import type { TaskPreview } from './model.ts'

export const taskPeriods = [
  { id: 'all', label: '전체 기간' }, { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' }, { id: 'undated', label: '마감 미정' },
] as const
export type TaskPeriod = typeof taskPeriods[number]['id'] | 'selected-week'

export function taskPeriodRange(period: TaskPeriod, today: string, selectedDate = today): { start: string; end: string } | null {
  if (period === 'week' || period === 'selected-week') {
    const week = currentWeek(period === 'week' ? today : selectedDate)
    return { start: week[0], end: week[6] }
  }
  if (period === 'month') {
    const first = `${today.slice(0, 7)}-01`
    const last = new Date(`${first}T00:00:00Z`)
    last.setUTCMonth(last.getUTCMonth() + 1, 0)
    return { start: first, end: last.toISOString().slice(0, 10) }
  }
  return null
}

export function filterTaskPeriod(tasks: TaskPreview[], period: TaskPeriod, today: string, selectedDate = today): TaskPreview[] {
  if (period === 'undated') return tasks.filter(task => !task.dueDate)
  const range = taskPeriodRange(period, today, selectedDate)
  return range ? tasks.filter(task => task.dueDate && task.dueDate >= range.start && task.dueDate <= range.end) : tasks
}

export function taskSummary(tasks: TaskPreview[]) {
  return { total: tasks.length, remaining: tasks.filter(task => task.status !== 'submitted').length,
    submitted: tasks.filter(task => task.status === 'submitted').length, unknown: tasks.filter(task => !task.dueDate).length }
}
