import { isSemester, isTerm } from '../../domain/academicTerm.ts'
import type { Semester } from '../../domain/academicTerm.ts'
export type CourseErrors = Partial<Record<keyof CourseDraft, string>>

export interface CourseDraft {
  year: string
  semester: Semester
  name: string
  section: string
  days: number[]
  startTime: string
}

export interface Course {
  id: string
  term: string
  name: string
  section: string
  days: number[]
  startTime: string | null
  revision: number
}

export const weekdays = ['월', '화', '수', '목', '금', '토', '일'] as const
export function emptyDraft(term: string): CourseDraft {
  const [year, semester] = term.split('-')
  return { year, semester: semester as Semester, name: '', section: '', days: [], startTime: '' }
}

export function courseDraft(course: Course): CourseDraft {
  return { ...emptyDraft(course.term), name: course.name, section: course.section, days: [...course.days], startTime: course.startTime ?? '' }
}

export class CourseError extends Error {
  readonly fields: CourseErrors

  constructor(message: string, fields: CourseErrors = {}) {
    super(message)
    this.name = 'CourseError'
    this.fields = fields
  }
}

export function validateDraft(draft: CourseDraft): CourseErrors {
  const errors: CourseErrors = {}
  if (!/^[1-9]\d{3}$/.test(draft.year)) errors.year = '연도는 네 자리 숫자로 입력해 주세요.'
  if (!isSemester(draft.semester)) errors.semester = '학기를 선택해 주세요.'
  if (!draft.name.trim() || draft.name.trim().length > 100) errors.name = '과목명은 1~100자로 입력해 주세요.'
  if (!draft.section.trim() || draft.section.trim().length > 30) errors.section = '분반은 1~30자로 입력해 주세요.'
  if (!Array.isArray(draft.days) || draft.days.some(day => !Number.isInteger(day) || day < 1 || day > 7) || new Set(draft.days).size !== draft.days.length) {
    errors.days = '수업 요일을 다시 선택해 주세요.'
  }
  if (draft.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime)) errors.startTime = '올바른 시작 시각을 입력해 주세요.'
  if (draft.days.length > 0 && !draft.startTime) errors.startTime = '요일에 맞는 시작 시각을 입력해 주세요.'
  if (draft.startTime && draft.days.length === 0) errors.days = '수업 요일을 하나 이상 선택해 주세요.'
  return errors
}

const identity = (course: Pick<Course, 'term' | 'name' | 'section'>) =>
  JSON.stringify([course.term, course.name.normalize('NFC').trim().toLocaleLowerCase('ko-KR'), course.section.normalize('NFC').trim().toLocaleLowerCase('ko-KR')])

export function upsertCourse(courses: Course[], draft: CourseDraft, id: string, expectedRevision?: number): { courses: Course[]; course: Course } {
  const errors = validateDraft(draft)
  if (Object.keys(errors).length) throw new CourseError('입력 내용을 확인해 주세요.', errors)
  const existing = courses.find(course => course.id === id)
  if (expectedRevision !== undefined && (!existing || existing.revision !== expectedRevision)) {
    throw new CourseError('다른 창에서 과목이 변경되었습니다. 저장된 내용을 다시 불러온 뒤 수정해 주세요.')
  }
  const course: Course = {
    id,
    term: `${draft.year}-${draft.semester}`,
    name: draft.name.normalize('NFC').trim(),
    section: draft.section.normalize('NFC').trim(),
    days: [...draft.days].sort((a, b) => a - b),
    startTime: draft.startTime || null,
    revision: (existing?.revision ?? 0) + 1,
  }
  if (courses.some(other => other.id !== id && identity(other) === identity(course))) {
    throw new CourseError('같은 학기에 같은 과목명과 분반이 이미 등록되어 있습니다.', { section: '이미 등록된 과목·분반입니다.' })
  }
  return { course, courses: existing ? courses.map(other => other.id === id ? course : other) : [...courses, course] }
}

export function isCourse(value: unknown): value is Course {
  if (!value || typeof value !== 'object') return false
  const c = value as Record<string, unknown>
  if (typeof c.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(c.id) || !isTerm(c.term)) return false
  if (typeof c.name !== 'string' || typeof c.section !== 'string' || !Array.isArray(c.days)) return false
  if (c.startTime !== null && typeof c.startTime !== 'string') return false
  if (!Number.isSafeInteger(c.revision) || (c.revision as number) < 1) return false
  return Object.keys(validateDraft(courseDraft(c as unknown as Course))).length === 0
}

export function scheduleLabel(course: Course): string {
  return course.startTime ? `${course.days.map(day => weekdays[day - 1]).join('·')} ${course.startTime}` : '수업 시간 미정'
}
