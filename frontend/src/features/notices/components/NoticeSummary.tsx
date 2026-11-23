import { Icon } from '@/components/ui/Icon'
import { noticeStatusLabels } from '../model'
import type { Notice } from '../model'
import './NoticeSummary.css'

export function NoticeSummary({ notice, onOpen, reviewHref }: { notice: Notice; onOpen?: () => void; reviewHref?: string }) {
  return (
    <section className="panel notice-summary" aria-label="공지 검토 요약">
      <span className="eyebrow">{notice.source === 'example' ? 'REVIEW PREVIEW' : 'MANUAL NOTICE'}</span>
      <h2>{notice.summary?.taskTitle ?? noticeStatusLabels[notice.status]}</h2>
      <p className="notice-summary-description">{notice.summary?.description ?? (notice.source === 'manual'
        ? '직접 입력한 원문입니다. 분석이나 과제 반영은 수행하지 않았습니다.'
        : '공지의 처리 상태를 보여 주는 예시입니다. 실제 과제에 반영된 내용은 아닙니다.')}</p>
      {notice.summary && (
        <dl>
          {notice.summary.fields.map(field => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>
                {field.before && <><del>{field.before}</del><Icon name="arrow" size={13} /></>}
                <strong>{field.after}</strong>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {notice.source === 'example' && <p className="notice-summary-note">화면 확인을 위해 미리 작성한 예시입니다. 실제 AI 분석 결과가 아닙니다.</p>}
      {reviewHref && <a href={reviewHref} className="button primary">변경사항 검토<Icon name="arrow" size={14} /></a>}
      {onOpen && (
        <a href={`#/notices/${notice.id}`} className={`button ${reviewHref ? 'secondary' : 'primary'}`} onClick={onOpen}>
          원문·요약 보기<Icon name="arrow" size={14} />
        </a>
      )}
    </section>
  )
}
