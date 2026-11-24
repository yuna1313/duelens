import { useEffect, useRef } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { reviewFieldLabels } from '@/features/reviews/model'
import type { ReviewCandidate, ReviewDraft, ReviewField, ReviewResult, ReviewTask } from '@/features/reviews/model'
import { noticeTimestamp } from '@/features/notices/model'
import type { Notice } from '@/features/notices/model'
import './ReviewPage.css'

interface Props {
  reviewId: string | null; today: string; candidates: ReviewCandidate[]; tasks: ReviewTask[]; sources: Notice[]
  results: Record<string, ReviewResult>; onApply: (id: string, draft: ReviewDraft) => ReviewResult
}
export function ReviewPage({ reviewId, today, candidates, tasks, sources, results, onApply }: Props) {
  const candidate = candidates.find(item => item.id === (reviewId ?? candidates[0]?.id))
  const source = sources.find(item => item.id === candidate?.noticeId)
  const result = candidate ? results[candidate.id] : undefined
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const next = candidates.find(item => item.id !== candidate?.id && !results[item.id])
  const [year, month] = today.split('-').map(Number)
  const semester = `${month < 3 ? year - 1 : year}년 ${month >= 3 && month <= 8 ? 1 : 2}학기`
  useEffect(() => { if (result) resultHeading.current?.focus({ preventScroll: true }) }, [result])

  return (
    <WorkspaceLayout semester={semester} activePage="notices">
      <a className="review-back-link" href="#/notices"><Icon name="back" size={14} />공지함으로</a>
      {!candidate || !source ? (
        <section className="panel review-not-found"><Icon name="file" size={30} /><h1>{candidates.length ? '이 검토를 찾을 수 없어요.' : '선택한 학기에 검토할 공지가 없어요.'}</h1><p>학기를 확인하거나 공지함에서 검토할 공지를 다시 선택해 주세요.</p><a className="button secondary" href="#/notices">공지함으로</a></section>
      ) : (
        <>
          <div className="page-heading review-page-heading"><div><h1>{result ? '검토 결과를 확인해 주세요.' : '바뀐 내용을 확인해 주세요.'}</h1><p>공지의 조건을 비교하고 과제에 사용할 값을 선택하세요.</p></div></div>
          <ol className="review-steps" aria-label="공지 검토 단계">
            <li className="done"><span><Icon name="check" size={12} /></span>공지 확인</li>
            <li className={result ? 'done' : 'active'} aria-current={!result ? 'step' : undefined}><span>{result ? <Icon name="check" size={12} /> : '2'}</span>변경 검토</li>
            <li className={result ? 'active' : ''} aria-current={result ? 'step' : undefined}><span>3</span>반영 결과</li>
          </ol>
          {import.meta.env.DEV && <div className="review-preview-note"><Icon name="info" size={17} /><p><strong>프론트 흐름 미리보기</strong>확인한 값을 이 탭의 과제·공지 상태·변경 이력·앱 내 알림에 반영합니다. 실제 AI 분석·학교 제출·서버 저장은 수행하지 않습니다.</p></div>}
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
                <section className="panel review-result" aria-label="검토 반영 결과">
                  <span className="review-result-icon"><Icon name="check" size={25} /></span>
                  <span className="eyebrow">REVIEW COMPLETE</span><h2 ref={resultHeading} tabIndex={-1}>선택한 값으로 검토를 마쳤어요.</h2>
                  <p>{result.isNew ? '새 과제로 등록한 내용' : '기존 과제에 반영한 내용'}입니다. 아래 값은 검토 완료 당시의 기록입니다.</p>
                  <div className="review-result-target"><span>{result.isNew ? '새 과제' : '연결한 과제'}</span><strong>{result.title}</strong><small>{result.course} · {result.section}분반</small></div>
                  <dl>{(Object.keys(reviewFieldLabels) as ReviewField[]).map(field => (
                    <div key={field}><dt>{reviewFieldLabels[field]}{result.changedFields.includes(field) && <span>변경</span>}</dt><dd>{result.values[field] || (field === 'dueDate' ? '날짜 미정' : field === 'dueTime' ? '시각 미정' : '미정')}</dd></div>
                  ))}</dl>
                  <p className="review-result-summary" role="status">{result.changedFields.length ? `${result.changedFields.length}개 항목을 변경한 결과입니다.` : '모든 현재 값을 유지한 결과입니다.'}</p>
                  <div className="review-result-scope"><Icon name="info" size={16} /><p>이 탭의 과제·변경 이력·앱 내 알림에 반영했습니다. 메뉴를 이동해도 유지되며 새로고침하면 초기화됩니다.</p></div>
                  <div className="review-result-actions">
                    <a className="button secondary" href={`#/tasks/${result.targetId}`}>반영한 과제 보기</a>
                    {next ? <a className="button primary" href={`#/reviews/${next.id}`}>다음 예시 검토<Icon name="arrow" size={14} /></a> : <a className="button primary" href="#/notices">공지함으로</a>}
                  </div>
                </section>
              ) : (
                <ReviewForm key={candidate.id} candidate={candidate} tasks={tasks} source={{ title: source.title, paragraphs: source.paragraphs, timestamp: noticeTimestamp(source.publishedAt) }} onComplete={draft => {
                  onApply(candidate.id, draft)
                  window.scrollTo(0, 0)
                }} />
              )}
            </div>
          </div>
        </>
      )}
      <p className="review-scope-note"><Icon name="shield" size={14} />학교 미연결 · 완료 결과는 메뉴 이동 중 유지됩니다. 새로고침하면 초기화되며 완료 전 선택은 화면을 나가면 초기화됩니다.</p>
    </WorkspaceLayout>
  )
}
