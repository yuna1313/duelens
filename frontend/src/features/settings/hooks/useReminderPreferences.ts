import { useEffect, useState } from 'react'
import { readReminderPreferences, reminderStorageKey, saveReminderOption } from '../storage'
import type { PreferenceSnapshot } from '../storage'
import type { ReminderOption } from '../model'

interface Snapshot { saved: PreferenceSnapshot | null; error: string | null }
function load(): Snapshot {
  try { return { saved: readReminderPreferences(window.localStorage), error: null } }
  catch (error) { return { saved: null, error: error instanceof Error ? error.message : '알림 설정을 읽을 수 없습니다.' } }
}

export function useReminderPreferences() {
  const [snapshot, setSnapshot] = useState<Snapshot>(load)
  const [message, setMessage] = useState('')
  function reload() { setSnapshot(load()); setMessage('') }
  useEffect(() => {
    const listener = (event: StorageEvent) => { if (event.key === reminderStorageKey || event.key === null) { setSnapshot(load()); setMessage('') } }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [])
  function update(option: ReminderOption, enabled: boolean) {
    if (!snapshot.saved) return
    try {
      const saved = saveReminderOption(window.localStorage, option, enabled, snapshot.saved.raw)
      setSnapshot({ saved, error: null })
      setMessage('알림 옵션을 이 브라우저에 저장했습니다. 실제 알림 발송은 아직 연결되지 않았습니다.')
    } catch (error) {
      setSnapshot(previous => ({ ...previous, error: error instanceof Error ? error.message : '설정을 저장하지 못했습니다.' }))
      setMessage('')
    }
  }
  return { ...snapshot, message, update, reload }
}
