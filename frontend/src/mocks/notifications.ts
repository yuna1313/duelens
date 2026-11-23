import type { NotificationItem, PlannedNotification } from '@/features/notifications/model'
import { offsetDate } from '@/utils/date'

// 알림 목록·읽음·발송 상태 확인용 예시입니다. 실제 과제 상태나 발송 서비스와 연결되지 않습니다.
export function createPreviewNotifications(today: string): { items: NotificationItem[]; planned: PlannedNotification[] } {
  return {
    items: [
      {
        id: 'notification-interview', title: '사용자 인터뷰 정리, 제출하셨나요?',
        description: `작성 완료로 기록된 과제입니다. ${today} 18:00까지 실제 제출을 마무리했는지 확인해 주세요.`,
        course: '인간컴퓨터상호작용', occurredAt: `${today}T13:30:00+09:00`, category: 'deadline', delivery: 'failed',
        failureReason: '브라우저 알림을 전달하지 못한 예시입니다. 앱 내 알림에서 내용을 확인할 수 있습니다.',
        isRead: false, target: { type: 'task', id: 'preview-interview' },
      },
      {
        id: 'notification-report', title: '중간보고서에 변경 후보가 있어요.',
        description: `${offsetDate(today, 4)} → ${offsetDate(today, 7)} · HWP → PDF. 공지의 변경 내용을 검토해 주세요.`,
        course: '프로그래밍 기초', occurredAt: `${today}T12:10:00+09:00`, category: 'change', delivery: 'in-app',
        failureReason: null, isRead: false, target: { type: 'review', id: 'report-change' },
      },
      {
        id: 'notification-database', title: 'ER 다이어그램 설계 보고서를 등록했어요.',
        description: `${offsetDate(today, 2)} 23:59 마감 · PDF 제출. 등록된 내용을 확인해 주세요.`,
        course: '데이터베이스', occurredAt: `${today}T10:15:00+09:00`, category: 'task', delivery: 'requested',
        failureReason: null, isRead: true, target: { type: 'task', id: 'preview-database' },
      },
      {
        id: 'notification-prototype', title: '프로토타입 개선안의 날짜를 확인해 주세요.',
        description: '‘다음 수업 전까지’라고 안내된 과제입니다. 정확한 날짜와 시각을 임의로 확정하지 않습니다.',
        course: '인간컴퓨터상호작용', occurredAt: `${offsetDate(today, -1)}T16:40:00+09:00`, category: 'date-check', delivery: 'in-app',
        failureReason: null, isRead: true, target: { type: 'review', id: 'date-check' },
      },
    ],
    planned: [
      {
        id: 'planned-database-day', taskId: 'preview-database', title: 'ER 다이어그램 설계 보고서', course: '데이터베이스',
        scheduledAt: `${offsetDate(today, 1)}T23:59:00+09:00`, dueAt: `${offsetDate(today, 2)}T23:59:00+09:00`, reason: 'day-before',
      },
      {
        id: 'planned-database-hours', taskId: 'preview-database', title: 'ER 다이어그램 설계 보고서', course: '데이터베이스',
        scheduledAt: `${offsetDate(today, 2)}T20:59:00+09:00`, dueAt: `${offsetDate(today, 2)}T23:59:00+09:00`, reason: 'three-hours-before',
      },
    ],
  }
}
