export type TaskStatus = 'todo' | 'in-progress' | 'written' | 'submitted'
export type TaskGroup = 'overdue' | 'today' | 'upcoming' | 'unknown' | 'submitted'

export interface TaskPreview {
  id: string
  title: string
  course: string
  section: string
  tone: 'blue' | 'purple' | 'sand' | 'green'
  dueDate: string | null
  dueTime: string | null
  status: TaskStatus
  description: string
}

export const statusLabels: Record<TaskStatus, string> = {
  todo: '미시작',
  'in-progress': '진행 중',
  written: '작성 완료',
  submitted: '제출 완료',
}

export const taskGroups: { id: TaskGroup; label: string }[] = [
  { id: 'overdue', label: '마감 지남' },
  { id: 'today', label: '오늘까지' },
  { id: 'upcoming', label: '다가오는 과제' },
  { id: 'unknown', label: '마감 확인 필요' },
  { id: 'submitted', label: '제출 완료' },
]

export function seoulDateKey(now = new Date()): string {
  const date = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

export function offsetDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function taskGroup(task: TaskPreview, today: string): TaskGroup {
  if (task.status === 'submitted') return 'submitted'
  if (!task.dueDate) return 'unknown'
  if (task.dueDate < today) return 'overdue'
  return task.dueDate === today ? 'today' : 'upcoming'
}

export function filterTasks(tasks: TaskPreview[], query: string, course: string, status: TaskStatus | 'all'): TaskPreview[] {
  const needle = query.normalize('NFC').trim().toLocaleLowerCase('ko-KR')
  return tasks
    .filter(task => (course === 'all' || task.course === course)
      && (status === 'all' || task.status === status)
      && `${task.title} ${task.course} ${task.section}`.normalize('NFC').toLocaleLowerCase('ko-KR').includes(needle))
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
      || (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99')
      || a.title.localeCompare(b.title, 'ko'))
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
