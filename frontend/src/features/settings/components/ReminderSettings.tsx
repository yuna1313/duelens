import { useId } from 'react'
import { Toggle } from '@/components/ui/Toggle'
import { Icon } from '@/components/ui/Icon'
import { reminderOptions } from '../model'
import { useReminderPreferences } from '../hooks/useReminderPreferences'
import './ReminderSettings.css'

export function ReminderSettings() {
  const prefix = useId()
  const { saved, error, message, update, reload } = useReminderPreferences()
  return (
    <section className="panel reminder-settings" aria-label="알림 기본 설정">
      <h2>알림 설정</h2><p className="reminder-settings-lead">옵션은 이 브라우저에 저장합니다. 실제 알림 예약·발송은 아직 연결되지 않았습니다.</p>
      {reminderOptions.map(option => (
        <div className="reminder-setting-row" key={option.id}><div><h3 id={`${prefix}-${option.id}`}>{option.label}</h3><p>{option.description}</p></div><Toggle checked={saved?.data[option.id] ?? false} labelledBy={`${prefix}-${option.id}`} disabled={!saved || Boolean(error)} onChange={value => update(option.id, value)} /></div>
      ))}
      {error && <div className="reminder-setting-error" role="alert"><p>{error}</p><button className="button secondary" type="button" onClick={reload}>설정 다시 불러오기</button></div>}
      {message && <p className="reminder-setting-message" role="status"><Icon name="check" size={14} />{message}</p>}
    </section>
  )
}
