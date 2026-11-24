import { useId, useState } from 'react'
import { currentTerm, isTerm, semesters } from '@/domain/academicTerm'
import { Icon } from './Icon'
import './AcademicTermControl.css'

interface Props {
  term: string | null
  onSelect: (term: string) => boolean
  onCancel?: () => void
  enabled?: boolean
  submitLabel?: string
}

export function AcademicTermForm({ term, onSelect, onCancel, enabled = true, submitLabel = '선택한 학기 보기' }: Props) {
  const prefix = useId()
  const [year, setYear] = useState((term ?? currentTerm()).split('-')[0])
  const [semester, setSemester] = useState(term?.split('-')[1] ?? '')
  const [error, setError] = useState('')
  return <form noValidate onSubmit={event => {
    event.preventDefault()
    const selected = `${year}-${semester}`
    if (!isTerm(selected)) { setError('올바른 연도(1000~9999년)와 학기를 선택해 주세요.'); return }
    if (!enabled) return
    if (!onSelect(selected)) setError('학기를 저장하지 못했습니다. 브라우저의 저장 상태를 확인해 주세요.')
  }}>
    <div className="academic-term-inputs">
      <div><label htmlFor={`${prefix}-year`}>연도</label><input id={`${prefix}-year`} name="year" type="number" min="1000" max="9999" required value={year} aria-invalid={Boolean(error)} aria-describedby={error ? `${prefix}-error` : undefined} onChange={event => { setYear(event.target.value); setError('') }} /></div>
      <div><label htmlFor={`${prefix}-semester`}>학기</label><div className="academic-term-select"><select id={`${prefix}-semester`} name="semester" required value={semester} aria-invalid={Boolean(error)} aria-describedby={error ? `${prefix}-error` : undefined} onChange={event => { setSemester(event.target.value); setError('') }}><option value="" disabled>학기 선택</option>{semesters.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><Icon name="chevron" size={16} /></div></div>
    </div>
    <p className="academic-term-note">{term ? '과제의 학기는 등록한 소속 기준입니다. 마감 날짜로 학기를 임의로 나누지 않습니다.' : '연도는 현재 날짜 기준의 추천값입니다. 사용할 학기를 직접 선택한 뒤 확인해 주세요.'}</p>
    {error && <p id={`${prefix}-error`} className="academic-term-error" role="alert">{error}</p>}
    <footer>{onCancel && <button type="button" className="button secondary" onClick={onCancel}>취소</button>}<button type="submit" className="button primary" disabled={!enabled}>{submitLabel}</button></footer>
  </form>
}
