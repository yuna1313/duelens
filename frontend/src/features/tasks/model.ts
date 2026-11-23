import { isCalendarDate } from '../../utils/date.ts'

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
  source: 'example' | 'manual'
  submissionFormat: string
  quantity: string
  submissionUrl: string
}

export interface TaskDraft {
  title: string
  course: string
  section: string
  dueDate: string
  dueTime: string
  status: TaskStatus
  submissionFormat: string
  quantity: string
  submissionUrl: string
  description: string
}

export type TaskErrors = Partial<Record<keyof TaskDraft, string>>
export type SaveTaskResult = { ok: true; task: TaskPreview } | { ok: false; message: string; fields: TaskErrors }

export class TaskError extends Error {
  readonly fields: TaskErrors

  constructor(message: string, fields: TaskErrors = {}) {
    super(message)
    this.name = 'TaskError'
    this.fields = fields
  }
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

export function emptyTaskDraft(): TaskDraft {
  return {
    title: '', course: '', section: '001', dueDate: '', dueTime: '', status: 'todo',
    submissionFormat: '', quantity: '', submissionUrl: '', description: '',
  }
}

export function taskDraft(task: TaskPreview): TaskDraft {
  return {
    title: task.title, course: task.course, section: task.section,
    dueDate: task.dueDate ?? '', dueTime: task.dueTime ?? '', status: task.status,
    submissionFormat: task.submissionFormat, quantity: task.quantity,
    submissionUrl: task.submissionUrl, description: task.description,
  }
}

export function safeSubmissionUrl(value: string): string | null {
  const hasControlCharacter = Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  if (value.length > 2048 || hasControlCharacter) return null
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    return url.href
  } catch { return null }
}

export function validateTaskDraft(draft: TaskDraft): TaskErrors {
  const errors: TaskErrors = {}
  if (!draft.course.trim() || draft.course.trim().length > 100) errors.course = '과목명은 1~100자로 입력해 주세요.'
  if (!draft.section.trim() || draft.section.trim().length > 30) errors.section = '분반은 1~30자로 입력해 주세요.'
  if (!draft.title.trim() || draft.title.trim().length > 150) errors.title = '과제명은 1~150자로 입력해 주세요.'
  if (draft.dueDate && !isCalendarDate(draft.dueDate)) errors.dueDate = '올바른 마감 날짜를 입력해 주세요.'
  if (draft.dueTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.dueTime)) errors.dueTime = '올바른 마감 시각을 입력해 주세요.'
  if (draft.dueTime && !draft.dueDate) errors.dueDate = '시각을 입력하려면 마감 날짜도 입력해 주세요.'
  if (!Object.hasOwn(statusLabels, draft.status)) errors.status = '진행 상태를 선택해 주세요.'
  if (draft.submissionFormat.length > 100) errors.submissionFormat = '제출 형식은 100자 이내로 입력해 주세요.'
  if (draft.quantity.length > 100) errors.quantity = '분량은 100자 이내로 입력해 주세요.'
  if (draft.description.length > 20_000) errors.description = '메모는 20,000자 이내로 입력해 주세요.'
  if (draft.submissionUrl.trim() && !safeSubmissionUrl(draft.submissionUrl)) errors.submissionUrl = '계정 정보가 포함되지 않은 http 또는 https 주소를 입력해 주세요.'
  return errors
}

export function upsertTask(tasks: TaskPreview[], draft: TaskDraft, id: string): { tasks: TaskPreview[]; task: TaskPreview } {
  const errors = validateTaskDraft(draft)
  if (Object.keys(errors).length) throw new TaskError('입력 내용을 확인해 주세요.', errors)
  const existing = tasks.find(task => task.id === id)
  const task: TaskPreview = {
    id, title: draft.title.trim(), course: draft.course.trim(), section: draft.section.trim(),
    dueDate: draft.dueDate || null, dueTime: draft.dueTime || null, status: draft.status,
    submissionFormat: draft.submissionFormat.trim(), quantity: draft.quantity.trim(),
    submissionUrl: draft.submissionUrl.trim() ? safeSubmissionUrl(draft.submissionUrl)! : '',
    description: draft.description.trim(), source: existing?.source ?? 'manual', tone: existing?.tone ?? 'green',
  }
  return { task, tasks: existing ? tasks.map(item => item.id === id ? task : item) : [...tasks, task] }
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
