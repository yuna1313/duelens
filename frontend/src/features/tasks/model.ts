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
