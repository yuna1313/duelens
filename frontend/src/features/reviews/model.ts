import { isCalendarDate } from '../../utils/date.ts'

export interface ReviewValues {
  dueDate: string | null
  dueTime: string | null
  submissionFormat: string
  quantity: string
}
export type ReviewField = keyof ReviewValues
export type ReviewChoice = 'proposal' | 'current'
export interface ReviewTask {
  id: string
  title: string
  course: string
  section: string
  values: ReviewValues
}
export interface ReviewCandidate {
  id: string
  noticeId: string
  title: string
  course: string
  section: string
  label: string
  description: string
  expectedTaskId: string | null
  allowNew: boolean
  needsDate: boolean
  before: ReviewValues
  proposal: Partial<ReviewValues>
  evidence: string
}
export interface ReviewDraft {
  targetId: string
  baseline: ReviewValues | null
  targetConfirmed: boolean
  choices: Partial<Record<ReviewField, ReviewChoice>>
  manualDate: string
  manualTime: string
  dateConfirmed: boolean
  timeUnknown: boolean
}
export interface ReviewResult {
  candidateId: string
  targetId: string | null
  title: string
  course: string
  section: string
  isNew: boolean
  values: ReviewValues
  changedFields: ReviewField[]
}
export type ReviewErrors = Partial<Record<ReviewField | 'target' | 'targetConfirmed' | 'dateConfirmed' | 'choices' | 'stale', string>>

export const reviewFieldLabels: Record<ReviewField, string> = {
  dueDate: '마감 날짜', dueTime: '마감 시각', submissionFormat: '제출 형식', quantity: '분량',
}
export const emptyReviewValues = (): ReviewValues => ({ dueDate: null, dueTime: null, submissionFormat: '', quantity: '' })
export const reviewFields = (candidate: ReviewCandidate): ReviewField[] =>
  (Object.keys(reviewFieldLabels) as ReviewField[]).filter(field => Object.hasOwn(candidate.proposal, field))

export function eligibleTargets(candidate: ReviewCandidate, tasks: ReviewTask[]): ReviewTask[] {
  return tasks.filter(task => task.course === candidate.course && task.section === candidate.section)
}

export function conflictFields(candidate: ReviewCandidate, target?: ReviewTask): ReviewField[] {
  return target ? reviewFields(candidate).filter(field => target.values[field] !== candidate.before[field]) : []
}

export function initialReviewDraft(candidate: ReviewCandidate, tasks: ReviewTask[], targetId = candidate.expectedTaskId ?? ''): ReviewDraft {
  const target = eligibleTargets(candidate, tasks).find(task => task.id === targetId)
  const conflicts = conflictFields(candidate, target)
  const choices: ReviewDraft['choices'] = {}
  for (const field of reviewFields(candidate)) if (!conflicts.includes(field)) choices[field] = 'proposal'
  return {
    targetId, baseline: target ? { ...target.values } : null,
    targetConfirmed: Boolean(target && targetId === candidate.expectedTaskId), choices,
    manualDate: '', manualTime: '', dateConfirmed: false, timeUnknown: false,
  }
}

export function proposedValues(candidate: ReviewCandidate, draft: ReviewDraft): Partial<ReviewValues> {
  return candidate.needsDate
    ? { ...candidate.proposal, dueDate: draft.manualDate || null, dueTime: draft.timeUnknown ? null : draft.manualTime || null }
    : candidate.proposal
}

export function resolvedValues(candidate: ReviewCandidate, tasks: ReviewTask[], draft: ReviewDraft): ReviewValues {
  const current = tasks.find(task => task.id === draft.targetId)?.values ?? emptyReviewValues()
  const proposal = proposedValues(candidate, draft)
  const values = { ...current }
  for (const field of reviewFields(candidate)) {
    if (draft.choices[field] !== 'proposal') continue
    if (field === 'dueDate' || field === 'dueTime') values[field] = proposal[field] ?? null
    else values[field] = proposal[field] ?? ''
  }
  return values
}

export function validateReview(candidate: ReviewCandidate, tasks: ReviewTask[], draft: ReviewDraft): ReviewErrors {
  const errors: ReviewErrors = {}
  const target = eligibleTargets(candidate, tasks).find(task => task.id === draft.targetId)
  const isNew = draft.targetId === 'new' && candidate.allowNew
  if (!target && !isNew) errors.target = '같은 과목·분반의 연결할 과제를 선택해 주세요.'
  if (target && (!draft.baseline || (Object.keys(reviewFieldLabels) as ReviewField[]).some(field => target.values[field] !== draft.baseline?.[field]))) {
    errors.stale = '검토 중 과제 값이 바뀌었습니다. 선택을 초기화하고 다시 확인해 주세요.'
  }
  if (!draft.targetConfirmed) errors.targetConfirmed = '선택한 과제 또는 새 과제 등록을 확인해 주세요.'
  const fields = reviewFields(candidate)
  if (!fields.length || fields.some(field => !['current', 'proposal'].includes(draft.choices[field] ?? ''))) {
    errors.choices = '각 항목에서 현재 값 유지 또는 공지 값 사용을 선택해 주세요.'
  }
  if (candidate.needsDate && draft.choices.dueDate === 'proposal') {
    if (!isCalendarDate(draft.manualDate)) errors.dueDate = '직접 확인한 올바른 마감 날짜를 입력해 주세요.'
    if (!draft.dateConfirmed) errors.dateConfirmed = '마감 날짜를 직접 확인했는지 표시해 주세요.'
  }
  if (candidate.needsDate && draft.choices.dueTime === 'proposal' && !draft.timeUnknown && !draft.manualTime) {
    errors.dueTime = '시각을 입력하거나 시각 미정을 선택해 주세요.'
  }
  const values = resolvedValues(candidate, tasks, draft)
  if (values.dueDate && !isCalendarDate(values.dueDate)) errors.dueDate = '올바른 마감 날짜를 확인해 주세요.'
  if (values.dueTime && (!values.dueDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.dueTime))) errors.dueTime = '날짜와 함께 올바른 마감 시각을 확인해 주세요.'
  return errors
}

export class ReviewError extends Error {
  readonly fields: ReviewErrors
  constructor(fields: ReviewErrors) {
    super('확인이 필요한 항목을 확인해 주세요.')
    this.name = 'ReviewError'
    this.fields = fields
  }
}

export function applyReview(candidate: ReviewCandidate, tasks: ReviewTask[], draft: ReviewDraft): ReviewResult {
  const errors = validateReview(candidate, tasks, draft)
  if (Object.keys(errors).length) throw new ReviewError(errors)
  const target = tasks.find(task => task.id === draft.targetId)
  const before = target?.values ?? emptyReviewValues()
  const values = resolvedValues(candidate, tasks, draft)
  return {
    candidateId: candidate.id, targetId: target?.id ?? null, title: target?.title ?? candidate.title,
    course: candidate.course, section: candidate.section, isNew: draft.targetId === 'new', values,
    changedFields: (Object.keys(reviewFieldLabels) as ReviewField[]).filter(field => values[field] !== before[field]),
  }
}
