import { useId, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import {
  conflictFields, eligibleTargets, initialReviewDraft, proposedValues,
  resolvedValues, ReviewError, reviewFieldLabels, reviewFields, validateReview,
} from '../model'
import type { ReviewCandidate, ReviewChoice, ReviewDraft, ReviewField, ReviewTask } from '../model'
import './ReviewForm.css'

interface Props {
  candidate: ReviewCandidate
  tasks: ReviewTask[]
  source: { title: string; paragraphs: string[]; timestamp: string }
  onComplete: (draft: ReviewDraft) => void
}

const displayValue = (field: ReviewField, value: string | null | undefined) => value
  || (field === 'dueDate' ? '날짜 미정' : field === 'dueTime' ? '시각 미정' : '미정')

export function ReviewForm({ candidate, tasks, source, onComplete }: Props) {
  const prefix = useId()
  const [draft, setDraft] = useState(() => initialReviewDraft(candidate, tasks))
  const [message, setMessage] = useState('')
  const targets = eligibleTargets(candidate, tasks)
  const target = targets.find(item => item.id === draft.targetId)
  const conflicts = conflictFields(candidate, target)
  const proposal = proposedValues(candidate, draft)
  const fields = reviewFields(candidate)
  const pending = validateReview(candidate, tasks, draft)
  const values = resolvedValues(candidate, tasks, draft)
  const changedCount = fields.filter(field => values[field] !== (target?.values[field] ?? (field === 'dueDate' || field === 'dueTime' ? null : ''))).length

  function update<K extends keyof ReviewDraft>(field: K, value: ReviewDraft[K]) {
    setDraft(previous => ({ ...previous, [field]: value }))
    setMessage('')
  }

  function choose(field: ReviewField, choice: ReviewChoice) {
    setDraft(previous => ({ ...previous, choices: { ...previous.choices, [field]: choice } }))
    setMessage('')
  }

  return (
    <form className="review-form" noValidate onSubmit={event => {
      event.preventDefault()
      try { onComplete(draft) }
      catch (error) { setMessage(error instanceof ReviewError ? Object.values(error.fields).join(' ') : '검토 결과를 반영하지 못했습니다. 입력 내용을 확인해 주세요.') }
    }}>
      {conflicts.length > 0 && (
        <div className="review-attention" role="status">
          <strong>직접 수정한 값이 있어요.</strong>
          <p>공지의 기준값과 현재 값이 다릅니다. 표시된 항목에서 현재 값을 유지할지 공지 값을 사용할지 선택해 주세요.</p>
        </div>
      )}
      <section className="panel review-target-panel">
        <header><div><span className="eyebrow">TARGET TASK</span><h2>연결할 과제</h2></div><Icon name="file" size={21} /></header>
        <label className="sr-only" htmlFor={`${prefix}-target`}>연결할 과제 선택</label>
        <select id={`${prefix}-target`} value={draft.targetId} onChange={event => {
          setDraft(initialReviewDraft(candidate, tasks, event.target.value))
          setMessage('')
        }}>
          <option value="">과제를 선택해 주세요</option>
          {candidate.allowNew && <option value="new">새 과제로 등록</option>}
          {targets.map(item => <option key={item.id} value={item.id}>{item.title} · {item.section}분반</option>)}
        </select>
        <p>{candidate.course} · {candidate.section}분반{target ? ` · ${target.title}` : ''}</p>
        <label className="review-check">
          <input type="checkbox" checked={draft.targetConfirmed} disabled={!draft.targetId} onChange={event => update('targetConfirmed', event.target.checked)} />
          {draft.targetId === 'new' ? '새 과제로 등록하는 선택을 확인했습니다.' : '연결할 과목·분반·과제를 확인했습니다.'}
        </label>
      </section>
      {candidate.needsDate && (
        <section className="panel review-date-panel">
          <h2>마감 날짜를 확인해 주세요.</h2>
          <p>‘다음 수업 전까지’만으로 날짜를 확정하지 않습니다. 직접 확인한 날짜를 입력하고, 시각이 불명확하면 미정으로 남겨 주세요.</p>
          <div className="review-date-inputs">
            <div><label htmlFor={`${prefix}-date`}>마감 날짜</label><input id={`${prefix}-date`} type="date" min="1000-01-01" max="9999-12-31" value={draft.manualDate} onChange={event => {
              setDraft(previous => ({ ...previous, manualDate: event.target.value, dateConfirmed: false }))
              setMessage('')
            }} /></div>
            <div><label htmlFor={`${prefix}-time`}>마감 시각</label><input id={`${prefix}-time`} type="time" step="60" disabled={draft.timeUnknown} value={draft.manualTime} onChange={event => update('manualTime', event.target.value)} /></div>
          </div>
          <label className="review-check"><input type="checkbox" checked={draft.timeUnknown} onChange={event => {
            const checked = event.target.checked
            setDraft(previous => ({ ...previous, timeUnknown: checked, manualTime: checked ? '' : previous.manualTime }))
            setMessage('')
          }} />시각 미정으로 유지합니다.</label>
          <label className="review-check"><input type="checkbox" checked={draft.dateConfirmed} onChange={event => update('dateConfirmed', event.target.checked)} />마감 날짜를 직접 확인했습니다.</label>
          <small>한국 표준시 (UTC+9)</small>
        </section>
      )}
      <section className="panel review-comparison">
        <header><h2>변경 전후 비교</h2><button type="button" onClick={() => {
          setDraft(initialReviewDraft(candidate, tasks, draft.targetId)); setMessage('')
        }}>선택 초기화</button></header>
        {fields.map(field => (
          <fieldset className={`review-field ${conflicts.includes(field) ? 'has-conflict' : ''}`} key={field}>
            <legend>{reviewFieldLabels[field]}{conflicts.includes(field) && <span>직접 수정값 확인</span>}</legend>
            <div className="review-value-grid">
              <div><span>현재 값</span><p>{displayValue(field, target?.values[field])}</p>{conflicts.includes(field) && <small>공지 기준값: {displayValue(field, candidate.before[field])}</small>}</div>
              <div className="review-proposal"><span>공지 후보</span><p>{displayValue(field, proposal[field])}</p></div>
            </div>
            <div className="review-choices">
              <label><input type="radio" name={`${prefix}-${field}`} checked={draft.choices[field] === 'current'} onChange={() => choose(field, 'current')} />현재 값 유지</label>
              <label><input type="radio" name={`${prefix}-${field}`} checked={draft.choices[field] === 'proposal'} onChange={() => choose(field, 'proposal')} />공지 값 사용</label>
            </div>
          </fieldset>
        ))}
      </section>
      <section className="panel review-evidence">
        <h2>변경의 근거</h2><blockquote>{candidate.evidence}</blockquote>
        <p><Icon name="file" size={13} />{source.title} · {source.timestamp}</p>
        <details><summary>원문 전체 보기</summary><div>{source.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></details>
      </section>
      <footer className="review-footer">
        <div>
          <p><strong>{changedCount}개 항목</strong>을 이 탭의 과제에 반영합니다.</p>
          {Object.keys(pending).length > 0 && <ul aria-live="polite">{[...new Set(Object.values(pending))].map(problem => <li key={problem}>{problem}</li>)}</ul>}
          {message && <p className="review-error" role="alert">{message}</p>}
        </div>
        <button type="submit" className="button primary" disabled={Object.keys(pending).length > 0}><Icon name="check" size={15} />{changedCount ? '선택한 내용 반영' : '현재 값 유지하고 완료'}</button>
      </footer>
    </form>
  )
}
