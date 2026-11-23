export interface HistoryValues {
  dueDate: string | null
  dueTime: string | null
  submissionFormat: string
  quantity: string
  progress: string
}

export type HistoryField = keyof HistoryValues
export type HistoryKind = 'notice-applied' | 'manual-edit' | 'created'

export interface HistorySource {
  noticeId: string | null
  title: string
  capturedAt: string
  availability: 'available' | 'expired'
  evidence: string
  paragraphs: string[]
}

export interface HistoryRecord {
  id: string
  taskId: string
  version: number
  occurredAt: string
  kind: HistoryKind
  before: HistoryValues | null
  after: HistoryValues
  note: string
  source: HistorySource | null
}

export const historyFieldLabels: Record<HistoryField, string> = {
  dueDate: '마감 날짜', dueTime: '마감 시각', submissionFormat: '제출 형식', quantity: '분량', progress: '진행 상태',
}

export const historyKindLabels: Record<HistoryKind, string> = {
  'notice-applied': '공지 검토 반영', 'manual-edit': '직접 수정', created: '최초 등록',
}

export function historyChanges(record: HistoryRecord): HistoryField[] {
  return (Object.keys(historyFieldLabels) as HistoryField[])
    .filter(field => !record.before || record.before[field] !== record.after[field])
}

export function historyValue(field: HistoryField, value: string | null): string {
  return value || (field === 'dueDate' ? '날짜 미정' : field === 'dueTime' ? '시각 미정' : '미정')
}

export function filterHistory(records: HistoryRecord[], taskId: string, kind: HistoryKind | 'all'): HistoryRecord[] {
  return records.filter(record => record.taskId === taskId && (kind === 'all' || record.kind === kind))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || b.version - a.version)
}

export function historyTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(timestamp))
}
