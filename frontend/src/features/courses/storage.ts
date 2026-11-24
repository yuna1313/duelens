import { CourseError, isCourse, upsertCourse } from './model.ts'
import { currentTerm, isTerm } from '../../domain/academicTerm.ts'
import type { Course, CourseDraft } from './model.ts'

export const storageKey = 'duelens.courses.v1'
export interface CourseState { version: 1; courses: Course[]; selectedTerm: string }
export interface CourseStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

export function readCourses(storage: Pick<CourseStorage, 'getItem'>): CourseState {
  let raw: string | null
  try { raw = storage.getItem(storageKey) } catch {
    throw new CourseError('이 기기의 저장 공간을 읽을 수 없습니다. 브라우저 저장 권한을 확인하고 다시 시도해 주세요.')
  }
  if (raw === null) return { version: 1, courses: [], selectedTerm: currentTerm() }
  try {
    if (raw.length > 1_000_000) throw new Error('Oversized data')
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') throw new Error('Invalid data')
    const value = data as Record<string, unknown>
    if (value.version !== 1 || !isTerm(value.selectedTerm) || !Array.isArray(value.courses) || !value.courses.every(isCourse)) throw new Error('Invalid schema')
    const courses: Course[] = value.courses.map(c => ({ id: c.id, term: c.term, name: c.name, section: c.section, days: [...c.days], startTime: c.startTime, revision: c.revision }))
    if (new Set(courses.map(course => course.id)).size !== courses.length) throw new Error('Duplicate IDs')
    const identities = courses.map(c => JSON.stringify([c.term, c.name.normalize('NFC').trim().toLocaleLowerCase('ko-KR'), c.section.normalize('NFC').trim().toLocaleLowerCase('ko-KR')]))
    if (new Set(identities).size !== courses.length) throw new Error('Duplicate courses')
    return { version: 1, courses, selectedTerm: value.selectedTerm }
  } catch {
    throw new CourseError('저장된 과목 정보를 읽을 수 없습니다. 기존 데이터는 그대로 보존했습니다. 다른 창의 상태나 저장 데이터를 확인한 뒤 다시 시도해 주세요.')
  }
}

export function writeCourses(storage: CourseStorage, state: CourseState): void {
  try {
    const raw = JSON.stringify(state)
    if (raw.length > 1_000_000) throw new Error('Storage limit exceeded')
    storage.setItem(storageKey, raw)
  } catch {
    throw new CourseError('저장하지 못했습니다. 저장 공간이나 브라우저 권한을 확인해 주세요. 입력 내용은 아직 이 창에 남아 있습니다.')
  }
}

export function saveCourse(storage: CourseStorage, draft: CourseDraft, id: string, expectedRevision?: number): { state: CourseState; course: Course } {
  const current = readCourses(storage)
  const { courses, course } = upsertCourse(current.courses, draft, id, expectedRevision)
  const state: CourseState = { version: 1, courses, selectedTerm: course.term }
  writeCourses(storage, state)
  return { state, course }
}
