import { Icon } from '@/components/ui/Icon'
import { notificationCategoryLabels, notificationDeliveryLabels, notificationTimestamp } from '../model'
import type { NotificationCategory, NotificationItem } from '../model'
import './NotificationList.css'

const categoryIcons = { deadline: 'clock', change: 'refresh', task: 'check', 'date-check': 'calendar' } as const satisfies Record<NotificationCategory, string>

export function NotificationList({ items, targetLinks, onReadChange }: {
  items: NotificationItem[]
  targetLinks: Record<string, string>
  onReadChange: (id: string, isRead: boolean) => void
}) {
  return (
    <ul className="panel notification-list" aria-label="알림 목록">
      {items.map(item => (
        <li key={item.id} className={`notification-item ${item.isRead ? '' : 'is-unread'}`}>
          <span className={`notification-category-icon ${item.category}`}><Icon name={categoryIcons[item.category]} size={18} /></span>
          <article aria-labelledby={`notification-${item.id}`}>
            <div className="notification-meta">
              {!item.isRead && <span className="notification-unread-dot" aria-label="읽지 않음" />}
              <span>{notificationCategoryLabels[item.category]}</span><span>·</span><time dateTime={item.occurredAt}>{notificationTimestamp(item.occurredAt)}</time>
            </div>
            <a className="notification-target" href={targetLinks[item.id]}>
              <h2 id={`notification-${item.id}`}>{item.title}</h2><p>{item.description}</p>
              <span>{item.course}<span className="notification-target-action">{item.target.type === 'review' ? '변경 검토' : '과제 보기'}<Icon name="arrow" size={12} /></span></span>
            </a>
            {item.delivery === 'failed' && <p className="notification-delivery-note failure"><Icon name="info" size={13} />{item.failureReason ?? '전달하지 못했습니다. 앱 내 알림으로 내용을 확인해 주세요.'}</p>}
            {item.delivery === 'requested' && <p className="notification-delivery-note">발송 요청 상태는 전달 완료를 의미하지 않습니다.</p>}
          </article>
          <div className="notification-item-actions">
            <span className={`notification-delivery ${item.delivery}`}>{notificationDeliveryLabels[item.delivery]}</span>
            <span className="notification-read-state">{item.isRead ? '읽음' : '읽지 않음'}</span>
            <button type="button" onClick={() => onReadChange(item.id, !item.isRead)} aria-label={`${item.title} ${item.isRead ? '읽지 않음으로 표시' : '읽음으로 표시'}`}>
              {item.isRead ? '읽지 않음으로' : <><Icon name="check" size={12} />읽음으로 표시</>}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
