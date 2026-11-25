import { useContext, useEffect, useId, useRef, useState } from 'react'
import { AcademicTermContext } from '@/contexts/AcademicTermContext'
import { termLabel } from '@/domain/academicTerm'
import { AcademicTermForm } from './AcademicTermForm'
import { Icon } from './Icon'
import './AcademicTermControl.css'

function TermDialog({ term, onClose, onSelect }: { term: string | null; onClose: () => void; onSelect: (term: string) => boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const prefix = useId()
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
      <AcademicTermForm term={term} onCancel={onClose} onSelect={selected => { if (!onSelect(selected)) return false; onClose(); return true }} />
    </dialog>
  )
}

export function AcademicTermControl({ fallback }: { fallback: string }) {
  const preferences = useContext(AcademicTermContext)
  const [open, setOpen] = useState(false)
  if (!preferences) return <div className="semester-label"><Icon name="calendar" size={15} />{fallback}</div>
  const label = preferences.preview ? `예시 · ${termLabel(preferences.selectedTerm)}` : preferences.selectedTerm ? termLabel(preferences.selectedTerm) : '학기 선택'
  return <><button type="button" className="semester-label semester-switch" disabled={!preferences.enabled} aria-label={preferences.selectedTerm && !preferences.preview ? `${label} 학기 변경` : '학기 선택'} onClick={() => setOpen(true)}><Icon name="calendar" size={15} /><span>{label}</span><Icon name="chevron" size={12} /></button>{open && <TermDialog term={preferences.preview ? null : preferences.selectedTerm} onClose={() => setOpen(false)} onSelect={preferences.selectTerm} />}</>
}
