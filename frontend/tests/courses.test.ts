import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CourseError, currentTerm, emptyDraft, upsertCourse, validateDraft } from '../src/features/courses/model.ts'
import { readCourses, saveCourse } from '../src/features/courses/storage.ts'
import type { CourseDraft } from '../src/features/courses/model.ts'

const id = '3ba0bc31-5406-45d3-b81a-a9f4956123b2'
const secondId = 'ffec5c0b-371d-42bd-a92f-12a2ce69c773'
const draft = (changes: Partial<CourseDraft> = {}): CourseDraft => ({ ...emptyDraft('2026-2'), name: '프로그래밍 기초', section: '001', ...changes })
class MemoryStorage {
  value: string | null = null
  getItem() { return this.value }
  setItem(_key: string, value: string) { this.value = value }
}

test('동일 과목도 학기 또는 분반이 다르면 별개로 등록한다', () => {
  const first = upsertCourse([], draft(), id).courses
  assert.throws(() => upsertCourse(first, draft({ name: ' 프로그래밍 기초 ' }), secondId), CourseError)
  assert.equal(upsertCourse(first, draft({ section: '002' }), secondId).courses.length, 2)
  assert.equal(upsertCourse(first, draft({ year: '2027' }), secondId).courses.length, 2)
})

test('시간표 미정은 시각을 임의로 붙이지 않으며 일부만 입력하면 거부한다', () => {
  assert.equal(upsertCourse([], draft(), id).course.startTime, null)
  assert.ok(validateDraft(draft({ days: [1] })).startTime)
  assert.ok(validateDraft(draft({ startTime: '10:00' })).days)
  for (const startTime of ['24:00', '09:60', '9:00']) assert.ok(validateDraft(draft({ days: [1], startTime })).startTime)
  assert.deepEqual(upsertCourse([], draft({ days: [3, 1], startTime: '00:00' }), id).course.days, [1, 3])
})

test('직접 수정 시 ID를 유지하고 다른 창에서 변경된 버전의 덮어쓰기를 막는다', () => {
  const first = upsertCourse([], draft(), id)
  const next = upsertCourse(first.courses, draft({ name: '프로그래밍 실습' }), id, 1)
  assert.equal(next.course.id, id)
  assert.equal(next.course.revision, 2)
  assert.throws(() => upsertCourse(next.courses, draft(), id, 1), /다른 창/)
})

test('과목과 선택 학기를 저장한 뒤 복원한다', () => {
  const storage = new MemoryStorage()
  saveCourse(storage, draft({ year: '2027', semester: '1', days: [2, 4], startTime: '13:00' }), id)
  const restored = readCourses(storage)
  assert.equal(restored.selectedTerm, '2027-1')
  assert.deepEqual(restored.courses[0].days, [2, 4])
  assert.equal(restored.courses[0].startTime, '13:00')
})

test('손상 데이터·알 수 없는 버전·잘못된 요일을 덮어쓰지 않는다', () => {
  const storage = new MemoryStorage()
  const course = upsertCourse([], draft(), id).course
  for (const value of ['{invalid', JSON.stringify({ version: 9 }), JSON.stringify({ version: 1, selectedTerm: '2026-2', courses: [{ ...course, days: [8] }] })]) {
    storage.value = value
    assert.throws(() => saveCourse(storage, draft(), secondId), /기존 데이터/)
    assert.equal(storage.value, value)
  }
})

test('저장 공간 오류는 성공으로 처리하지 않고 기존 데이터를 보존한다', () => {
  const storage = new MemoryStorage()
  saveCourse(storage, draft(), id)
  const before = storage.value
  const broken = { getItem: () => before, setItem: () => { throw new Error('QuotaExceededError') } }
  assert.throws(() => saveCourse(broken, draft({ section: '002' }), secondId), /저장하지 못했습니다/)
  assert.equal(storage.value, before)
  assert.throws(() => readCourses({ getItem: () => { throw new Error('SecurityError') } }), /저장 공간/)
})

test('기본 학기는 한국 날짜를 기준으로 정한다', () => {
  assert.equal(currentTerm(new Date('2026-08-31T15:00:00Z')), '2026-2')
  assert.equal(currentTerm(new Date('2026-02-15T00:00:00Z')), '2025-2')
})
