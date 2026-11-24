import { applyReview, ReviewError } from '../features/reviews/model.ts'
import type { ReviewCandidate, ReviewDraft, ReviewResult, ReviewTask } from '../features/reviews/model.ts'
import { statusLabels, taskDraft, TaskError, upsertTask } from '../features/tasks/model.ts'
import type { TaskDraft, TaskPreview } from '../features/tasks/model.ts'
import type { Course } from '../features/courses/model.ts'
import type { Notice, NoticeDraft } from '../features/notices/model.ts'
import { createManualNotice } from '../features/notices/model.ts'
import type { HistoryRecord, HistoryValues } from '../features/history/model.ts'
import { markAllNotificationsRead, setNotificationRead } from '../features/notifications/model.ts'
import type { NotificationItem } from '../features/notifications/model.ts'
import { termLabel } from '../domain/academicTerm.ts'

export interface WorkspaceState {
  tasks: TaskPreview[]
  notices: Notice[]
  candidates: ReviewCandidate[]
  results: Record<string, ReviewResult>
  history: HistoryRecord[]
  notifications: NotificationItem[]
}

export function historyValues(task: TaskPreview): HistoryValues {
  return { term: task.term ? termLabel(task.term) : undefined, title: task.title, course: `${task.course} · ${task.section}분반`, courseLink: task.courseId ? '등록한 과목 연결' : '직접 입력 또는 예시',
    dueDate: task.dueDate, dueTime: task.dueTime, submissionFormat: task.submissionFormat, quantity: task.quantity,
    progress: statusLabels[task.status], description: task.description, submissionUrl: task.submissionUrl }
}

export const reviewTasks = (tasks: TaskPreview[]): ReviewTask[] => tasks.map(task => ({
  id: task.id, term: task.term, title: task.title, course: task.course, section: task.section,
  values: { dueDate: task.dueDate, dueTime: task.dueTime, submissionFormat: task.submissionFormat, quantity: task.quantity },
}))

function recordChange(state: WorkspaceState, task: TaskPreview, before: TaskPreview | undefined, kind: HistoryRecord['kind'], now: string, source: HistoryRecord['source'] = null): HistoryRecord {
  const version = Math.max(0, ...state.history.filter(record => record.taskId === task.id).map(record => record.version)) + 1
  return { id: `${task.id}-v${version}`, taskId: task.id, version, occurredAt: now, kind,
    before: before ? historyValues(before) : null, after: historyValues(task), source,
    note: kind === 'notice-applied' ? '직접 확인한 공지 검토 결과를 반영했습니다.' : before ? '과제 내용 또는 진행 상태를 직접 수정했습니다.' : '과제를 등록했습니다.' }
}

export function saveWorkspaceTask(state: WorkspaceState, draft: TaskDraft, id: string, now: string, courses: Course[] = []): { state: WorkspaceState; result: TaskPreview } {
  const before = state.tasks.find(task => task.id === id)
  const linked = draft.courseId ? courses.find(course => course.id === draft.courseId) : undefined
  const preservedLink = before?.courseId === draft.courseId && before?.course === draft.course && before?.section === draft.section
  if (draft.courseId && !linked && !preservedLink) throw new TaskError('연결한 과목을 찾을 수 없습니다. 과목을 다시 선택하거나 직접 입력으로 변경해 주세요.', { courseId: '과목 연결을 확인해 주세요.' })
  const input = linked ? { ...draft, term: linked.term, course: linked.name, section: linked.section } : draft
  const saved = upsertTask(state.tasks, input, id)
  if (before && (Object.keys(saved.task) as (keyof TaskPreview)[]).every(key => before[key] === saved.task[key])) return { state, result: before }
  const record = recordChange(state, saved.task, before, before ? 'manual-edit' : 'created', now)
  return { state: { ...state, tasks: saved.tasks, history: [...state.history, record] }, result: saved.task }
}

export const resolveTaskCourses = (tasks: TaskPreview[], courses: Course[]): TaskPreview[] => tasks.map(task => {
  const linked = courses.find(course => course.id === task.courseId)
  return linked ? { ...task, term: linked.term, course: linked.name, section: linked.section } : task
})

export function applyWorkspaceReview(state: WorkspaceState, candidateId: string, draft: ReviewDraft, newTaskId: string, now: string): { state: WorkspaceState; result: ReviewResult } {
  // A completed candidate is immutable within this session, including duplicate submits.
  if (Object.hasOwn(state.results, candidateId)) return { state, result: state.results[candidateId] }
  const candidate = state.candidates.find(item => item.id === candidateId)
  const notice = state.notices.find(item => item.id === candidate?.noticeId)
  if (!candidate || !notice) throw new ReviewError({ target: '공지와 검토 대상을 다시 확인해 주세요.' })
  const result = applyReview(candidate, reviewTasks(state.tasks), draft)
  const before = state.tasks.find(task => task.id === result.targetId)
  const id = before?.id ?? newTaskId
  if (!before && state.tasks.some(task => task.id === id)) throw new ReviewError({ target: '새 과제 ID가 중복되었습니다. 다시 시도해 주세요.' })
  const input: TaskDraft = before ? taskDraft(before) : {
    term: result.term, title: result.title, course: result.course, section: result.section, status: 'todo',
    dueDate: '', dueTime: '', submissionFormat: '', quantity: '', submissionUrl: '', description: '',
  }
  const saved = upsertTask(state.tasks, { ...input, ...result.values, dueDate: result.values.dueDate ?? '', dueTime: result.values.dueTime ?? '' }, id)
  const task = before ? saved.task : { ...saved.task, source: notice.source }
  const completed = { ...result, targetId: id }
  const record = recordChange(state, task, before, before ? 'notice-applied' : 'created', now, {
    noticeId: notice.id, title: notice.title, capturedAt: now, availability: 'available',
    evidence: candidate.evidence, paragraphs: [...notice.paragraphs],
  })
  const notification: NotificationItem = {
    id: `review-complete-${candidate.id}`, term: task.term, source: 'session', title: `${task.title} 검토를 완료했어요.`,
    description: result.isNew ? '새 과제를 등록했습니다.' : result.changedFields.length ? `${result.changedFields.length}개 항목을 반영했습니다.` : '현재 과제 값을 유지했습니다.',
    course: task.course, occurredAt: now, category: 'task', delivery: 'in-app', failureReason: null, isRead: false, target: { type: 'task', id },
  }
  const results = { ...state.results, [candidateId]: completed }
  const pendingForNotice = state.candidates.some(item => item.noticeId === notice.id && !Object.hasOwn(results, item.id))
  return { result: completed, state: {
    ...state, tasks: saved.tasks.map(item => item.id === id ? task : item), results,
    notices: state.notices.map(item => item.id === notice.id ? { ...item, isRead: true, status: pendingForNotice ? 'review' : 'applied' } : item),
    history: [...state.history, record],
    notifications: [...state.notifications.map(item => item.target.type === 'review' && item.target.id === candidateId ? { ...item, isRead: true, target: { type: 'task' as const, id } } : item), notification],
  } }
}

export function createWorkspaceStore(initial: WorkspaceState) {
  let state = initial
  const listeners = new Set<() => void>()
  function update<T>(transition: (current: WorkspaceState) => { state: WorkspaceState; result: T }): T {
    const next = transition(state)
    if (next.state !== state) { state = next.state; listeners.forEach(listener => listener()) }
    return next.result
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    saveTask: (draft: TaskDraft, id: string, now: string, courses: Course[]) => update(current => saveWorkspaceTask(current, draft, id, now, courses)),
    applyReview: (id: string, draft: ReviewDraft, newId: string, now: string) => update(current => applyWorkspaceReview(current, id, draft, newId, now)),
    addNotice: (draft: NoticeDraft, id: string, now: Date) => update(current => {
      const notice = { ...createManualNotice(draft, id, now), isRead: true }
      return { state: { ...current, notices: [notice, ...current.notices] }, result: notice }
    }),
    setNoticeRead: (id: string, isRead: boolean) => update(current => ({ state: { ...current, notices: current.notices.map(item => item.id === id ? { ...item, isRead } : item) }, result: undefined })),
    setNotificationRead: (id: string, isRead: boolean) => update(current => ({ state: { ...current, notifications: setNotificationRead(current.notifications, id, isRead) }, result: undefined })),
    markNotificationsRead: (ids: string[]) => update(current => ({ state: { ...current, notifications: markAllNotificationsRead(current.notifications.filter(item => ids.includes(item.id))).concat(current.notifications.filter(item => !ids.includes(item.id))) }, result: undefined })),
  }
}
