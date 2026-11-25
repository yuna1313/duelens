import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reminderStorageKey, saveReminderOption } from '../src/features/settings/storage.ts'
import { createCourseBackup, deleteStoredCourses, maxCourseBackupBytes, parseCourseBackup, readCourseSnapshot, restoreCourseBackup } from '../src/pages/settings/courseBackup.ts'
import { storageKey } from '../src/features/courses/storage.ts'

class MemoryStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}
const course = { id: '3ba0bc31-5406-45d3-b81a-a9f4956123b2', term: '2026-2', name: '백업 확인 과목', section: '001', days: [1, 3], startTime: '10:00', revision: 1 }
const data = { version: 1, selectedTerm: '2026-2', courses: [course] }
const backupText = () => JSON.stringify({ format: 'duelens-course-backup', version: 1, exportedAt: '2026-11-23T12:00:00.000Z', data })

test('과목만 백업하며 알림 설정·다른 저장 키·알 수 없는 비밀 필드를 내보내지 않는다', () => {
  const storage = new MemoryStorage()
  storage.setItem(storageKey, JSON.stringify({ ...data, token: 'private-root', courses: [{ ...course, token: 'private-course' }] }))
  storage.setItem('auth.token', 'private-auth')
  saveReminderOption(storage, 'dayBefore', false, null)
  const text = createCourseBackup(storage)
  assert.doesNotMatch(text, /private-|auth.token|dayBefore|token/)
  assert.deepEqual(parseCourseBackup(text).data, data)
})

test('손상·미지원 버전·잘못된 과목·중복 ID·과대 파일을 거부한다', () => {
  const valid = JSON.parse(backupText())
  for (const value of ['{broken', JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ ...valid, data: null }), JSON.stringify({ ...valid, data: { ...data, courses: [{ ...course, days: [8] }] } }), JSON.stringify({ ...valid, data: { ...data, courses: [course, course] } }), JSON.stringify({ ...valid, data: { ...data, courses: [course, { ...course, id: '4ba0bc31-5406-45d3-b81a-a9f4956123b2' }] } })]) {
    assert.throws(() => parseCourseBackup(value))
  }
  assert.throws(() => parseCourseBackup(' '.repeat(maxCourseBackupBytes + 1)), /4MB/)
})

test('파일 검증만으로 저장하지 않으며 복원 시 과목 키만 교체한다', () => {
  const storage = new MemoryStorage()
  storage.setItem('unrelated', 'keep')
  const preferences = saveReminderOption(storage, 'dayBefore', false, null)
  const preview = parseCourseBackup(backupText())
  assert.equal(storage.getItem(storageKey), null)
  restoreCourseBackup(storage, preview, null)
  assert.deepEqual(readCourseSnapshot(storage).data, data)
  assert.equal(storage.getItem(reminderStorageKey), preferences.raw)
  assert.equal(storage.getItem('unrelated'), 'keep')
})

test('검토 중 변경·복원 실패·삭제 실패 시 기존 과목을 보존한다', () => {
  const storage = new MemoryStorage()
  storage.setItem(storageKey, JSON.stringify(data))
  const expected = storage.getItem(storageKey)
  assert.throws(() => restoreCourseBackup(storage, parseCourseBackup(backupText()), null), /다른 창/)
  assert.throws(() => deleteStoredCourses(storage, null), /다른 창/)
  const broken = { getItem: storage.getItem.bind(storage), setItem: () => { throw new Error('Quota') }, removeItem: () => { throw new Error('Security') } }
  assert.throws(() => restoreCourseBackup(broken, parseCourseBackup(backupText()), expected), /저장하지 못했습니다/)
  assert.throws(() => deleteStoredCourses(broken, expected), /삭제하지 못했습니다/)
  assert.equal(storage.getItem(storageKey), expected)
})

test('과목 삭제는 대상 키만 지우며 알림 설정과 다른 앱 데이터를 유지한다', () => {
  const storage = new MemoryStorage()
  storage.setItem(storageKey, JSON.stringify(data))
  storage.setItem('unrelated', 'keep')
  const preferences = saveReminderOption(storage, 'afterWritten', false, null)
  const result = deleteStoredCourses(storage, storage.getItem(storageKey))
  assert.equal(storage.getItem(storageKey), null)
  assert.equal(result.data.courses.length, 0)
  assert.equal(result.data.selectedTerm, null)
  assert.equal(storage.getItem(reminderStorageKey), preferences.raw)
  assert.equal(storage.getItem('unrelated'), 'keep')
})

test('학기 미선택 백업을 그대로 복원하고 확인한 기존 학기 백업도 보존한다', () => {
  const storage = new MemoryStorage()
  const empty = parseCourseBackup(createCourseBackup(storage))
  assert.equal(empty.data.selectedTerm, null)
  restoreCourseBackup(storage, empty, null)
  assert.equal(readCourseSnapshot(storage).data.selectedTerm, null)
  const selected = parseCourseBackup(backupText())
  restoreCourseBackup(storage, selected, storage.getItem(storageKey))
  assert.equal(readCourseSnapshot(storage).data.selectedTerm, '2026-2')
})
