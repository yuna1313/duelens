export type NotificationCategory = 'deadline' | 'change' | 'task' | 'date-check'
export type NotificationDelivery = 'in-app' | 'requested' | 'failed'
export type NotificationTab = 'all' | 'unread' | 'scheduled'

export interface NotificationItem {
  id: string
  term?: string
  source?: 'example' | 'session'
  title: string
  description: string
  course: string
  occurredAt: string
  category: NotificationCategory
  delivery: NotificationDelivery
  failureReason: string | null
  isRead: boolean
  target: { type: 'task' | 'review'; id: string }
}

export interface PlannedNotification {
  id: string
  taskId: string
  title: string
  course: string
  scheduledAt: string
  dueAt: string
  reason: 'day-before' | 'three-hours-before'
}

export const notificationCategoryLabels: Record<NotificationCategory, string> = {
  deadline: '마감 알림', change: '변경 발견', task: '과제 반영', 'date-check': '날짜 확인',
}
export const notificationDeliveryLabels: Record<NotificationDelivery, string> = {
  'in-app': '앱 내 알림', requested: '발송 요청', failed: '전달 실패',
}
export const plannedReasonLabels: Record<PlannedNotification['reason'], string> = {
  'day-before': '마감 하루 전', 'three-hours-before': '마감 3시간 전',
}

export function filterNotifications(items: NotificationItem[], tab: Exclude<NotificationTab, 'scheduled'>): NotificationItem[] {
  return items.filter(item => tab === 'all' || !item.isRead)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
}

export function setNotificationRead(items: NotificationItem[], id: string, isRead: boolean): NotificationItem[] {
  return items.map(item => item.id === id ? { ...item, isRead } : item)
}

export function markAllNotificationsRead(items: NotificationItem[]): NotificationItem[] {
  return items.map(item => item.isRead ? item : { ...item, isRead: true })
}

export function sortPlannedNotifications(items: PlannedNotification[]): PlannedNotification[] {
  return [...items].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
}

export function notificationTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(timestamp))
}
