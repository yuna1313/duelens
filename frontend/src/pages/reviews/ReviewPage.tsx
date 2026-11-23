import { useEffect, useRef, useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { reviewFieldLabels } from '@/features/reviews/model'
import type { ReviewField, ReviewResult } from '@/features/reviews/model'
import { noticeTimestamp } from '@/features/notices/model'
import { createReviewExamples } from '@/mocks/reviews'
import { createPreviewNotices } from '@/mocks/notices'
import { seoulDateKey } from '@/utils/date'
import './ReviewPage.css'

export function ReviewPage({ reviewId }: { reviewId: string | null }) {
  const [today] = useState(seoulDateKey)
  const [{ candidates, tasks }] = useState(() => createReviewExamples(today))
  const [sources] = useState(() => createPreviewNotices(today))
  const [results, setResults] = useState<Record<string, ReviewResult>>({})
  const candidate = candidates.find(item => item.id === (reviewId ?? candidates[0].id))
  const source = sources.find(item => item.id === candidate?.noticeId)
  const result = candidate ? results[candidate.id] : undefined
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const next = candidates.find(item => item.id !== candidate?.id && !results[item.id])
  const [year, month] = today.split('-').map(Number)
  const semester = `${month < 3 ? year - 1 : year}년 ${month >= 3 && month <= 8 ? 1 : 2}학기`
  useEffect(() => { if (result) resultHeading.current?.focus({ preventScroll: true }) }, [result])

  return (
    <WorkspaceLayout semester={semester} activePage="notices" pageTitle="변경 검토">
      <a className="review-back-link" href="#/notices"><Icon name="back" size={14} />공지함으로</a>
      {!candidate || !source ? (
        <section className="panel review-not-found"><Icon name="file" size={30} /><h1>이 검토 예시를 찾을 수 없어요.</h1><p>공지함에서 검토할 공지를 다시 선택해 주세요.</p><a className="button secondary" href="#/notices">공지함으로</a></section>
      ) : (
        <>
          <div className="page-heading review-page-heading"><div><h1>{result ? '검토 결과를 확인해 주세요.' : '바뀐 내용을 확인해 주세요.'}</h1><p>공지의 조건을 비교하고 과제에 사용할 값을 선택하세요.</p></div></div>
          <ol className="review-steps" aria-label="공지 검토 단계">
            <li className="done"><span><Icon name="check" size={12} /></span>공지 확인</li>
            <li className={result ? 'done' : 'active'} aria-current={!result ? 'step' : undefined}><span>{result ? <Icon name="check" size={12} /> : '2'}</span>변경 검토</li>
            <li className={result ? 'active' : ''} aria-current={result ? 'step' : undefined}><span>3</span>결과 미리보기</li>
          </ol>
          <div className="review-preview-note"><Icon name="info" size={17} /><p><strong>예시 데이터로 보는 검토 화면</strong>아래 선택은 이 화면의 결과 미리보기에만 사용됩니다. 내 과제 목록에는 반영되지 않습니다.</p></div>
          <div className="review-page-layout">
            <nav className="review-candidates" aria-label="검토 상황 예시">
              <div><span className="eyebrow">REVIEW CASES</span><h2>검토할 변경 <span>{candidates.length}</span></h2></div>
              <ul>{candidates.map(item => (
                <li key={item.id}><a href={`#/reviews/${item.id}`} aria-current={candidate.id === item.id ? 'page' : undefined}>
                  <span className="review-case-label">{item.label}{results[item.id] && <span><Icon name="check" size={11} />검토 완료</span>}</span>
                  <strong>{item.title}</strong><small>{item.course} · {item.section}분반</small><p>{item.description}</p>
                </a></li>
              ))}</ul>
            </nav>
            <div className="review-main">
              <div className="review-context"><span>{candidate.label}</span><h2>{candidate.title}</h2><p>{candidate.course} · {candidate.section}분반</p></div>
              {result ? (
                <section className="panel review-result" aria-label="검토 결과 미리보기">
                  <span className="review-result-icon"><Icon name="check" size={25} /></span>
                  <span className="eyebrow">REVIEW COMPLETE</span><h2 ref={resultHeading} tabIndex={-1}>선택한 값으로 검토를 마쳤어요.</h2>
                  <p>{result.isNew ? '새 과제로 등록할 내용' : '기존 과제에 사용할 내용'}을 확인해 주세요.</p>
                  <div className="review-result-target"><span>{result.isNew ? '새 과제' : '연결한 과제'}</span><strong>{result.title}</strong><small>{result.course} · {result.section}분반</small></div>
                  <dl>{(Object.keys(reviewFieldLabels) as ReviewField[]).map(field => (
                    <div key={field}><dt>{reviewFieldLabels[field]}{result.changedFields.includes(field) && <span>변경</span>}</dt><dd>{result.values[field] || (field === 'dueDate' ? '날짜 미정' : field === 'dueTime' ? '시각 미정' : '미정')}</dd></div>
                  ))}</dl>
                  <p className="review-result-summary" role="status">{result.changedFields.length ? `${result.changedFields.length}개 항목을 변경한 결과입니다.` : '모든 현재 값을 유지한 결과입니다.'}</p>
                  <div className="review-result-scope"><Icon name="info" size={16} /><p>검토 결과 미리보기입니다. 실제 과제 등록·수정, 학교 제출, 서버 저장은 수행하지 않았습니다.</p></div>
                  <div className="review-result-actions">
                    <button type="button" className="button secondary" onClick={() => setResults(previous => {
                      const updated = { ...previous }; delete updated[candidate.id]; return updated
                    })}>이 예시 다시 검토</button>
                    {next ? <a className="button primary" href={`#/reviews/${next.id}`}>다음 예시 검토<Icon name="arrow" size={14} /></a> : <a className="button primary" href="#/notices">공지함으로</a>}
                  </div>
                </section>
              ) : (
                <ReviewForm key={candidate.id} candidate={candidate} tasks={tasks} source={{ title: source.title, paragraphs: source.paragraphs, timestamp: noticeTimestamp(source.publishedAt) }} onComplete={value => {
                  setResults(previous => ({ ...previous, [candidate.id]: value }))
                  window.scrollTo(0, 0)
                }} />
              )}
            </div>
          </div>
        </>
      )}
      <p className="review-scope-note"><Icon name="shield" size={14} />학교 미연결 · 검토 화면을 벗어나거나 새로고침하면 선택·결과가 초기화됩니다.</p>
    </WorkspaceLayout>
  )
}
