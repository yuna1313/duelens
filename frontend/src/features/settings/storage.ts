import { parseReminderPreferences } from './model.ts'
import type { ReminderOption, ReminderPreferences } from './model.ts'

export const reminderStorageKey = 'duelens.reminders.v1'
export interface PreferenceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface PreferenceSnapshot { data: ReminderPreferences; raw: string | null }

export function readReminderPreferences(storage: Pick<PreferenceStorage, 'getItem'>): PreferenceSnapshot {
  let raw: string | null
  try { raw = storage.getItem(reminderStorageKey) } catch { throw new Error('이 브라우저의 알림 설정을 읽을 수 없습니다. 저장 권한을 확인해 주세요.') }
  return { data: parseReminderPreferences(raw), raw }
}

export function saveReminderOption(storage: PreferenceStorage, option: ReminderOption, enabled: boolean, expectedRaw: string | null): PreferenceSnapshot {
  const current = readReminderPreferences(storage)
  if (current.raw !== expectedRaw) throw new Error('다른 창에서 알림 설정이 바뀌었습니다. 저장된 설정을 다시 불러온 뒤 변경해 주세요.')
  const data = parseReminderPreferences(JSON.stringify({ ...current.data, [option]: enabled }))
  const raw = JSON.stringify(data)
  try { storage.setItem(reminderStorageKey, raw) } catch { throw new Error('알림 설정을 저장하지 못했습니다. 기존 설정을 유지합니다. 저장 공간이나 권한을 확인해 주세요.') }
  return { data, raw }
}
