export interface ReminderPreferences {
  version: 1
  dayBefore: boolean
  threeHoursBefore: boolean
  afterWritten: boolean
}
export type ReminderOption = Exclude<keyof ReminderPreferences, 'version'>
export const reminderOptions: { id: ReminderOption; label: string; description: string }[] = [
  { id: 'dayBefore', label: '마감 하루 전', description: '마감 날짜·시각이 정해진 과제의 24시간 전 알림 옵션입니다.' },
  { id: 'threeHoursBefore', label: '마감 3시간 전', description: '미제출 과제를 마감 전에 다시 확인하는 옵션입니다.' },
  { id: 'afterWritten', label: '작성 완료 후에도 알림', description: '작성 완료한 과제도 제출 완료로 기록하기 전까지 알림 대상으로 둡니다.' },
]
export const defaultReminderPreferences = (): ReminderPreferences => ({ version: 1, dayBefore: true, threeHoursBefore: true, afterWritten: true })

export function parseReminderPreferences(raw: string | null): ReminderPreferences {
  if (raw === null) return defaultReminderPreferences()
  try {
    if (raw.length > 2000) throw new Error('Too large')
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid data')
    const value = data as Record<string, unknown>
    if (value.version !== 1 || Object.keys(value).some(key => !['version', 'dayBefore', 'threeHoursBefore', 'afterWritten'].includes(key))
      || !['dayBefore', 'threeHoursBefore', 'afterWritten'].every(key => typeof value[key] === 'boolean')) throw new Error('Invalid settings')
    return { version: 1, dayBefore: value.dayBefore === true, threeHoursBefore: value.threeHoursBefore === true, afterWritten: value.afterWritten === true }
  } catch { throw new Error('저장된 알림 설정을 읽을 수 없습니다. 기존 설정은 보존했습니다.') }
}
