import { Icon } from '@/components/ui/Icon'
import { historyChanges, historyFieldLabels, historyKindLabels, historyTimestamp, historyValue } from '../model'
import type { HistoryField, HistoryRecord } from '../model'
import './HistoryTimeline.css'

export function HistoryTimeline({ records, sourceLinks }: { records: HistoryRecord[]; sourceLinks: Record<string, string> }) {
  return (
    <ol className="panel history-timeline" aria-label="버전별 변경 이력 · 최신순">
      {records.map(record => {
        const changes = historyChanges(record)
        const source = record.source
        const sourceHref = source?.availability === 'available' && source.noticeId ? sourceLinks[source.noticeId] : undefined
        return (
          <li key={record.id} className={`history-entry ${record.kind}`}>
            <span className="history-point" aria-hidden="true"><Icon name={record.kind === 'created' ? 'plus' : record.kind === 'manual-edit' ? 'edit' : 'check'} size={12} /></span>
            <article aria-labelledby={`history-${record.id}`}>
              <header>
                <time dateTime={record.occurredAt}>{historyTimestamp(record.occurredAt)}</time>
                <span className="history-version">v{record.version}</span><span className="history-kind">{historyKindLabels[record.kind]}</span>
              </header>
              <h2 id={`history-${record.id}`}>{record.kind === 'created' ? '과제를 처음 등록했어요.' : changes.length ? `${changes.map(field => historyFieldLabels[field]).join(' · ')} 변경` : '현재 값을 유지했어요.'}</h2>
              <p className="history-entry-note">{record.note}</p>
              {changes.length > 0 && (
                <dl className="history-diff" aria-label={record.before ? `버전 ${record.version} 변경 전후` : '최초 등록한 값'}>
                  {changes.map(field => (
                    <div key={field}><dt>{historyFieldLabels[field]}</dt><dd>
                      {record.before && <><del>{historyValue(field, record.before[field])}</del><Icon name="arrow" size={13} /><span className="sr-only">에서</span></>}
                      <strong>{historyValue(field, record.after[field])}</strong>
                    </dd></div>
                  ))}
                </dl>
              )}
              {source ? (
                <div className="history-source">
                  <blockquote>{source.evidence}</blockquote>
                  <p className="history-source-title"><Icon name="file" size={13} /><span>{source.title}</span>
                    {sourceHref && <a href={sourceHref}>공지 원문 보기<Icon name="arrow" size={12} /></a>}
                  </p>
                  {source.availability === 'expired' && <p className="history-source-expired"><Icon name="info" size={14} />원문 링크가 만료된 예시입니다. 기록 당시 보관한 원문은 계속 확인할 수 있습니다.</p>}
                  <details><summary>기록 당시 원문 보기</summary>
                    <div className="history-stored-source"><p className="history-captured-at">예시 원문 보관 시각 · {historyTimestamp(source.capturedAt)}</p>{source.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
                  </details>
                </div>
              ) : <p className="history-no-source"><Icon name="edit" size={12} />{record.kind === 'created' ? '직접 등록한 과제에는' : '직접 수정한 기록에는'} 근거 공지가 없습니다.</p>}
              <details className="history-snapshot"><summary>이 버전의 전체 값 보기</summary>
                <dl>{(Object.keys(historyFieldLabels) as HistoryField[]).filter(field => record.after[field] !== undefined).map(field => <div key={field}><dt>{historyFieldLabels[field]}</dt><dd>{historyValue(field, record.after[field])}</dd></div>)}</dl>
              </details>
            </article>
          </li>
        )
      })}
    </ol>
  )
}
