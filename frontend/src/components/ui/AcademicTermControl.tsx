import { useContext, useEffect, useId, useRef, useState } from 'react'
import { AcademicTermContext } from '@/contexts/AcademicTermContext'
import { isTerm, semesters, termLabel } from '@/domain/academicTerm'
import { Icon } from './Icon'
import './AcademicTermControl.css'

function TermDialog({ term, onClose, onSelect }: { term: string; onClose: () => void; onSelect: (term: string) => boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const prefix = useId()
  const [year, setYear] = useState(term.split('-')[0])
  const [semester, setSemester] = useState(term.split('-')[1])
  const [error, setError] = useState('')
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  return (
    <dialog ref={ref} className="academic-term-dialog" aria-labelledby={`${prefix}-title`} onCancel={event => { event.preventDefault(); onClose() }}>
      <header><h2 id={`${prefix}-title`}>학기 선택</h2><button type="button" className="icon-button" aria-label="학기 선택 닫기" onClick={onClose}><Icon name="close" size={20} /></button></header>
      <p>선택한 학기의 과목·과제·공지·검토·알림을 함께 조회합니다. 학기를 바꿔도 기존 기록은 삭제하지 않습니다.</p>
      <form noValidate onSubmit={event => {
        event.preventDefault()
        const selected = `${year}-${semester}`
        if (!isTerm(selected)) { setError('1000~9999년 사이의 연도와 학기를 선택해 주세요.'); return }
        if (onSelect(selected)) onClose()
        else setError('학기를 저장하지 못했습니다. 기존 학기를 유지합니다. 과목 관리에서 저장 상태를 확인해 주세요.')
      }}>
        <div className="academic-term-inputs"><div><label htmlFor={`${prefix}-year`}>연도</label><input id={`${prefix}-year`} type="number" min="1000" max="9999" value={year} onChange={event => { setYear(event.target.value); setError('') }} /></div><div><label htmlFor={`${prefix}-semester`}>학기</label><select id={`${prefix}-semester`} value={semester} onChange={event => { setSemester(event.target.value); setError('') }}>{semesters.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div>
        <p className="academic-term-note">과제의 학기는 등록한 소속 기준입니다. 마감 날짜로 학기를 임의로 나누지 않습니다.</p>
        {error && <p className="academic-term-error" role="alert">{error}</p>}
        <footer><button type="button" className="button secondary" onClick={onClose}>취소</button><button type="submit" className="button primary">선택한 학기 보기</button></footer>
      </form>
    </dialog>
  )
}

export function AcademicTermControl({ fallback }: { fallback: string }) {
  const preferences = useContext(AcademicTermContext)
  const [open, setOpen] = useState(false)
  if (!preferences) return <div className="semester-label"><Icon name="calendar" size={15} />{fallback}</div>
  return <><button type="button" className="semester-label semester-switch" disabled={!preferences.enabled} aria-label={`${termLabel(preferences.selectedTerm)} 학기 변경`} onClick={() => setOpen(true)}><Icon name="calendar" size={15} /><span>{termLabel(preferences.selectedTerm)}</span><Icon name="chevron" size={12} /></button>{open && <TermDialog term={preferences.selectedTerm} onClose={() => setOpen(false)} onSelect={preferences.selectTerm} />}</>
}
