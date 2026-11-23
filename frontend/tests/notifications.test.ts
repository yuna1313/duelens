import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  filterNotifications, markAllNotificationsRead, notificationTimestamp, setNotificationRead, sortPlannedNotifications,
} from '../src/features/notifications/model.ts'
import type { NotificationItem, PlannedNotification } from '../src/features/notifications/model.ts'

const item: NotificationItem = {
  id: 'unread', title: '마감 알림', description: '', course: '과목', occurredAt: '2026-11-23T12:00:00+09:00',
  category: 'deadline', delivery: 'failed', failureReason: '전달 실패 사유', isRead: false, target: { type: 'task', id: 'task' },
}

test('읽음 여부와 발송 상태를 구분해 필터하고 실제 시각 최신순으로 정렬한다', () => {
  const earlier: NotificationItem = { ...item, id: 'read', occurredAt: '2026-11-23T02:00:00Z', delivery: 'requested', isRead: true }
  const later: NotificationItem = { ...item, id: 'later', occurredAt: '2026-11-23T03:30:00Z', delivery: 'in-app' }
  const items = [earlier, item, later]
  assert.deepEqual(filterNotifications(items, 'all').map(value => value.id), ['later', 'unread', 'read'])
  assert.deepEqual(filterNotifications(items, 'unread').map(value => value.id), ['later', 'unread'])
  assert.deepEqual(items.map(value => value.id), ['read', 'unread', 'later'])
})

test('개별·전체 읽음 처리는 대상만 바꾸며 전달 실패 사유와 원본을 보존한다', () => {
  const other = { ...item, id: 'other' }
  const items = [item, other]
  const read = setNotificationRead(items, 'unread', true)
  assert.equal(read[0].isRead, true)
  assert.equal(read[1].isRead, false)
  assert.equal(read[0].delivery, 'failed')
  assert.equal(read[0].failureReason, '전달 실패 사유')
  assert.equal(items[0].isRead, false)
  assert.equal(setNotificationRead(read, 'unread', false)[0].isRead, false)
  assert.deepEqual(filterNotifications(markAllNotificationsRead(items), 'unread'), [])
  assert.deepEqual(setNotificationRead(items, 'missing', true), items)
})

test('발송 예정은 가까운 시각순으로 표시하며 읽음 처리와 별개로 유지한다', () => {
  const planned: PlannedNotification = {
    id: 'later', taskId: 'task', title: '과제', course: '과목', scheduledAt: '2026-11-24T20:59:00+09:00',
    dueAt: '2026-11-24T23:59:00+09:00', reason: 'three-hours-before',
  }
  const earlier = { ...planned, id: 'earlier', scheduledAt: '2026-11-23T14:59:00Z', reason: 'day-before' as const }
  const items = [planned, earlier]
  assert.deepEqual(sortPlannedNotifications(items).map(value => value.id), ['earlier', 'later'])
  assert.deepEqual(items.map(value => value.id), ['later', 'earlier'])
  assert.match(notificationTimestamp('2026-11-23T15:05:00Z'), /11.*24.*00:05/)
})
