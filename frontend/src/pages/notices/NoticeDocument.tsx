import { Icon } from '@/components/ui/Icon'
import { NoticeSummary } from '@/features/notices/components/NoticeSummary'
import { NoticeStatusBadge } from '@/features/notices/components/NoticeStatusBadge'
import { noticeTimestamp } from '@/features/notices/model'
import type { Notice } from '@/features/notices/model'

export function NoticeDocument({ notice, onToggleRead, reviewHref }: { notice: Notice; onToggleRead: () => void; reviewHref?: string }) {
  return (
    <>
      <a className="notice-back-link" href="#/notices"><Icon name="back" size={14} />공지 목록으로</a>
      <div className="page-heading">
        <div><h1>공지 원문</h1><p>원문을 확인하고 제출 조건을 살펴보세요.</p></div>
        <button type="button" className="button secondary" onClick={onToggleRead}>
          <Icon name="check" size={15} />{notice.isRead ? '읽지 않음으로 표시' : '읽음으로 표시'}
        </button>
      </div>
      <div className="notice-document-layout">
        <article className="panel notice-document">
          <header>
            <span className="notice-course-pill">{notice.course}</span>
            <h2>{notice.title}</h2>
            <div className="notice-document-meta">
              <span>{notice.source === 'example' ? '예시 게시 시각' : '직접 입력 시각'} {noticeTimestamp(notice.publishedAt)}</span>
              <NoticeStatusBadge status={notice.status} />
              <span>{notice.isRead ? '읽음' : '읽지 않음'}</span>
            </div>
          </header>
          <div className="notice-prose">{notice.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          <footer><Icon name="info" size={14} /><span>{notice.source === 'example'
            ? '디자인 확인용으로 작성된 예시 원문입니다. 실제 학교 공지가 아닙니다.'
            : '직접 입력한 원문입니다. 서버 전송·AI 분석·과제 반영은 수행하지 않았습니다.'}</span></footer>
        </article>
        <NoticeSummary notice={notice} reviewHref={reviewHref} />
      </div>
    </>
  )
}
