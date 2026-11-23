import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultReminderPreferences } from '../src/features/settings/model.ts'
import { readReminderPreferences, reminderStorageKey, saveReminderOption } from '../src/features/settings/storage.ts'

class MemoryStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

test('알림 옵션을 저장·복원하며 다른 옵션과 기본값을 유지한다', () => {
  const storage = new MemoryStorage()
  assert.deepEqual(readReminderPreferences(storage).data, defaultReminderPreferences())
  const saved = saveReminderOption(storage, 'dayBefore', false, null)
  assert.equal(readReminderPreferences(storage).data.dayBefore, false)
  assert.equal(saved.data.threeHoursBefore, true)
  assert.equal(saved.data.afterWritten, true)
})

test('손상 설정·다른 창 변경·저장 실패 시 성공으로 처리하거나 덮어쓰지 않는다', () => {
  const storage = new MemoryStorage()
  storage.setItem(reminderStorageKey, '{broken')
  assert.throws(() => saveReminderOption(storage, 'dayBefore', false, '{broken'), /보존/)
  assert.equal(storage.getItem(reminderStorageKey), '{broken')
  storage.removeItem(reminderStorageKey)
  const first = saveReminderOption(storage, 'dayBefore', false, null)
  assert.throws(() => saveReminderOption(storage, 'afterWritten', false, null), /다른 창/)
  const broken = { getItem: storage.getItem.bind(storage), setItem: () => { throw new Error('Quota') } }
  assert.throws(() => saveReminderOption(broken, 'afterWritten', false, first.raw), /저장하지 못했습니다/)
  assert.equal(storage.getItem(reminderStorageKey), first.raw)
})
