export type NoticeStatus = 'review' | 'date-check' | 'new-task' | 'applied' | 'no-task' | 'unreviewed'
export type NoticeTab = 'all' | 'review' | 'applied'

export interface Notice {
  id: string
  course: string
  title: string
  excerpt: string
  paragraphs: string[]
  publishedAt: string
  status: NoticeStatus
  isRead: boolean
  source: 'example' | 'manual'
  summary?: {
    taskTitle: string
    description: string
    fields: { label: string; before?: string; after: string }[]
  }
}

export interface NoticeDraft { course: string; title: string; body: string }
export type NoticeErrors = Partial<Record<keyof NoticeDraft, string>>

export const noticeStatusLabels: Record<NoticeStatus, string> = {
  review: '검토 필요',
  'date-check': '날짜 확인',
  'new-task': '신규 과제',
  applied: '반영 완료',
  'no-task': '과제 없음',
  unreviewed: '분석 전',
}

export const noticeTabs: { id: NoticeTab; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'review', label: '검토 필요' },
  { id: 'applied', label: '반영 완료' },
]

export const needsReview = (notice: Notice) =>
  notice.status !== 'applied' && notice.status !== 'no-task'

export function filterNotices(notices: Notice[], query: string, course: string, tab: NoticeTab): Notice[] {
  const needle = query.normalize('NFC').trim().toLocaleLowerCase('ko-KR')
  return notices
    .filter(notice => (course === 'all' || notice.course === course)
      && (tab === 'all' || (tab === 'review' ? needsReview(notice) : notice.status === 'applied'))
      && `${notice.title} ${notice.course} ${notice.paragraphs.join(' ')}`.normalize('NFC').toLocaleLowerCase('ko-KR').includes(needle))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
}

export function noticeTimestamp(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))
}

export function validateNoticeDraft(draft: NoticeDraft): NoticeErrors {
  const errors: NoticeErrors = {}
  if (!draft.course.trim() || draft.course.trim().length > 100) errors.course = '과목명은 1~100자로 입력해 주세요.'
  if (!draft.title.trim() || draft.title.trim().length > 150) errors.title = '공지 제목은 1~150자로 입력해 주세요.'
  if (!draft.body.trim() || draft.body.length > 20_000) errors.body = '공지 원문은 1~20,000자로 입력해 주세요.'
  return errors
}

export function createManualNotice(draft: NoticeDraft, id: string, now = new Date()): Notice {
  if (Object.keys(validateNoticeDraft(draft)).length) throw new Error('입력 내용을 확인해 주세요.')
  const body = draft.body.trim()
  return {
    id, course: draft.course.trim(), title: draft.title.trim(),
    excerpt: body.replace(/\s+/g, ' ').slice(0, 120),
    paragraphs: body.split(/\n\s*\n/), publishedAt: now.toISOString(),
    status: 'unreviewed', isRead: false, source: 'manual',
  }
}
