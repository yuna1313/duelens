import { Icon } from '@/components/ui/Icon'
import { notificationTimestamp, plannedReasonLabels, sortPlannedNotifications } from '../model'
import type { PlannedNotification } from '../model'
import './PlannedNotificationList.css'

export function PlannedNotificationList({ items, targetLinks, title }: { items: PlannedNotification[]; targetLinks: Record<string, string>; title: string }) {
  return (
    <section className="panel planned-notifications" aria-label={title}>
      <header><h2>{title}</h2><span>발송 예정 · 예시</span></header>
      <p className="planned-preview-note">아래 시각은 화면 확인용 예시입니다. 실제 알림은 예약되지 않았습니다.</p>
      <ul>{sortPlannedNotifications(items).map(item => (
        <li key={item.id}>
          <span className="planned-notification-icon"><Icon name="clock" size={17} /></span>
          <div><a href={targetLinks[item.id]}>{item.title}<Icon name="arrow" size={12} /></a><p>{item.course} · {plannedReasonLabels[item.reason]}</p><small>마감 <time dateTime={item.dueAt}>{notificationTimestamp(item.dueAt)}</time> · 한국 표준시</small></div>
          <time className="planned-notification-time" dateTime={item.scheduledAt}>{notificationTimestamp(item.scheduledAt)}</time>
        </li>
      ))}</ul>
    </section>
  )
}
