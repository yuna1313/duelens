import { useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { BrowserNotificationNotice } from '@/features/notifications/components/BrowserNotificationNotice'
import { NotificationList } from '@/features/notifications/components/NotificationList'
import { PlannedNotificationList } from '@/features/notifications/components/PlannedNotificationList'
import { filterNotifications, markAllNotificationsRead, setNotificationRead } from '@/features/notifications/model'
import type { NotificationTab } from '@/features/notifications/model'
import { createPreviewNotifications } from '@/mocks/notifications'
import { seoulDateKey } from '@/utils/date'
import './NotificationsPage.css'

export function NotificationsPage() {
  const [today] = useState(seoulDateKey)
  const [preview, setPreview] = useState(() => createPreviewNotifications(today))
  const [showExamples, setShowExamples] = useState(true)
  const [tab, setTab] = useState<NotificationTab>('all')
  const [message, setMessage] = useState('')
  const items = showExamples ? preview.items : []
  const planned = showExamples ? preview.planned : []
  const unread = items.filter(item => !item.isRead).length
  const filtered = tab === 'scheduled' ? [] : filterNotifications(items, tab)
  const targetLinks = Object.fromEntries(items.map(item => [item.id, item.target.type === 'review' ? `#/reviews/${item.target.id}` : `#/tasks/${item.target.id}`]))
  const plannedLinks = Object.fromEntries(planned.map(item => [item.id, `#/tasks/${item.taskId}`]))
  const tabs: { id: NotificationTab; label: string; count: number }[] = [
    { id: 'all', label: '전체', count: items.length }, { id: 'unread', label: '읽지 않음', count: unread }, { id: 'scheduled', label: '발송 예정', count: planned.length },
  ]
  const [year, month] = today.split('-').map(Number)
  const semester = `${month < 3 ? year - 1 : year}년 ${month >= 3 && month <= 8 ? 1 : 2}학기`

  function showTab(value: NotificationTab) { setTab(value); setMessage('') }

  return (
    <WorkspaceLayout semester={semester} activePage="notifications" pageTitle="알림센터">
      <div className="page-heading notifications-page-heading">
        <div><h1>알림</h1><p>마감과 바뀐 내용을 한 번 더 확인하세요.</p></div>
        <button type="button" className="button secondary" disabled={tab === 'scheduled' || !unread} onClick={() => {
          setPreview(previous => ({ ...previous, items: markAllNotificationsRead(previous.items) }))
          setMessage('모든 예시 알림을 읽음으로 표시했습니다. 발송 상태는 바뀌지 않습니다.')
        }}><Icon name="check" size={14} />모두 읽음으로 표시</button>
      </div>
      <section className="notifications-preview-banner" aria-label="알림 화면 미리보기 안내">
        <Icon name="info" size={18} /><div><strong>예시 데이터로 보는 알림센터</strong><p>알림과 발송 상태는 화면 확인용 예시입니다. 실제 과제 상태·공지 검토·알림 발송과 연결되지 않았습니다.</p></div>
        <button type="button" className="button secondary" onClick={() => { setShowExamples(value => !value); setMessage('') }}>{showExamples ? '예시 숨기기' : '예시 보기'}</button>
      </section>
      <BrowserNotificationNotice />
      <div className="notifications-tabs" role="group" aria-label="알림 보기">
        {tabs.map(item => <button type="button" key={item.id} className={tab === item.id ? 'active' : ''} aria-pressed={tab === item.id} onClick={() => showTab(item.id)}>{item.label}<span>{item.count}</span></button>)}
      </div>
      <p className="notifications-result-count" role="status">{tab === 'scheduled' ? `${planned.length}개 예정 예시 · 가까운 시각순` : `${filtered.length}개 알림 · 읽지 않음 ${unread}개 · 최신순`}</p>
      {tab === 'scheduled' ? planned.length ? <PlannedNotificationList items={planned} targetLinks={plannedLinks} title="발송 예정" /> : (
        <section className="panel notifications-empty"><span><Icon name="clock" size={28} /></span><h2>발송 예정 알림이 없어요.</h2><p>마감 날짜와 시각이 정해진 과제의 알림 예정 시각을 확인하는 화면입니다. 현재는 실제 알림을 예약하지 않습니다.</p><button type="button" className="button secondary" onClick={() => setShowExamples(true)}>예시 보기</button></section>
      ) : filtered.length ? (
        <NotificationList items={filtered} targetLinks={targetLinks} onReadChange={(id, isRead) => {
          setPreview(previous => ({ ...previous, items: setNotificationRead(previous.items, id, isRead) }))
          setMessage(isRead ? '이 알림을 읽음으로 표시했습니다.' : '이 알림을 읽지 않음으로 표시했습니다.')
        }} />
      ) : (
        <section className="panel notifications-empty"><span><Icon name={tab === 'unread' && items.length ? 'check' : 'bell'} size={28} /></span><h2>{tab === 'unread' && items.length ? '읽지 않은 알림이 없어요.' : '아직 알림이 없어요.'}</h2><p>{items.length ? '확인한 알림은 전체 목록에서 다시 볼 수 있습니다.' : '예시 알림으로 마감·변경 확인 흐름을 살펴보세요.'}</p><button type="button" className="button secondary" onClick={items.length ? () => showTab('all') : () => setShowExamples(true)}>{items.length ? '전체 알림 보기' : '예시 보기'}</button></section>
      )}
      {message && <p className="notifications-message" role="status"><Icon name="check" size={14} />{message}</p>}
      {tab !== 'scheduled' && planned.length > 0 && <PlannedNotificationList items={planned} targetLinks={plannedLinks} title="다음 알림" />}
      <p className="notifications-footer-note"><Icon name="shield" size={14} />읽음 상태는 이 화면에서만 유지됩니다. 다른 메뉴로 나가거나 새로고침하면 초기화됩니다.</p>
    </WorkspaceLayout>
  )
}
