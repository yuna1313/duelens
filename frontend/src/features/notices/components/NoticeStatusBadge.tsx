import { noticeStatusLabels } from '../model'
import type { NoticeStatus } from '../model'
import './NoticeStatusBadge.css'

export function NoticeStatusBadge({ status }: { status: NoticeStatus }) {
  return <span className={`notice-status-badge ${status}`}>{noticeStatusLabels[status]}</span>
}
