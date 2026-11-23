import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { termLabel } from '@/features/courses/model'
import type { CourseBackup, CourseSnapshot } from './courseBackup'
import './CourseDataDialog.css'

export type CourseDataReview = { kind: 'restore'; current: CourseSnapshot; backup: CourseBackup; filename: string } | { kind: 'delete'; current: CourseSnapshot }

export function CourseDataDialog({ review, stale, error, onClose, onConfirm }: { review: CourseDataReview; stale: boolean; error: string; onClose: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const prefix = useId()
  const [confirmed, setConfirmed] = useState(false)
  const restoring = review.kind === 'restore'
  const incoming = restoring ? review.backup.data : review.current.data
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  return (
    <dialog className="course-data-dialog" ref={dialogRef} aria-labelledby={`${prefix}-heading`} onCancel={event => { event.preventDefault(); onClose() }}>
      <header><div><span className="eyebrow">COURSE DATA</span><h2 id={`${prefix}-heading`}>{restoring ? '과목 백업 복원 확인' : '저장한 과목 삭제 확인'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="과목 데이터 확인 닫기"><Icon name="close" size={21} /></button></header>
      <p className="course-data-dialog-intro">{restoring ? '파일 내용으로 현재 과목과 선택 학기를 교체합니다. 확인 버튼을 누르기 전에는 저장하지 않습니다.' : '이 브라우저에 저장한 과목과 선택 학기 정보를 삭제합니다. 필요한 경우 먼저 과목 백업을 내보내 주세요.'}</p>
      {restoring && <p className="course-data-filename">파일: {review.filename}<br />백업 시각: {new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(review.backup.exportedAt))}</p>}
      <dl className="course-data-review-counts"><div><dt>현재 과목</dt><dd>{review.current.data.courses.length}개</dd></div><div><dt>{restoring ? '복원할 과목' : '삭제할 과목'}</dt><dd>{incoming.courses.length}개</dd></div><div><dt>{restoring ? '복원할 선택 학기' : '현재 선택 학기'}</dt><dd>{termLabel(incoming.selectedTerm)}</dd></div></dl>
      <ul className="course-data-review-list">{incoming.courses.slice(0, 6).map(course => <li key={course.id}><strong>{course.name}</strong><span>{termLabel(course.term)} · {course.section}분반</span></li>)}</ul>
      {incoming.courses.length > 6 && <p className="course-data-more">외 {incoming.courses.length - 6}개 과목</p>}
      <p className="course-data-scope"><Icon name="info" size={14} />과목 정보만 대상입니다. 알림 설정·학교 원본·다른 앱의 데이터는 변경하지 않습니다.</p>
      {restoring && incoming.courses.length === 0 && <p className="course-data-warning">빈 과목 백업입니다. 복원하면 현재 과목 목록도 비워집니다.</p>}
      <label className="course-data-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />{restoring ? '현재 과목을 위 백업 내용으로 교체하는 것을 확인했습니다.' : '위 과목과 선택 학기 정보를 삭제하는 것을 확인했습니다.'}</label>
      {stale && <p className="course-data-warning" role="alert">확인 중 과목 정보가 바뀌었습니다. 창을 닫고 최신 내용을 다시 확인해 주세요.</p>}
      {error && <p className="course-data-warning" role="alert">{error}</p>}
      <footer><button type="button" className="button secondary" onClick={onClose}>취소</button><button type="button" className={`button ${restoring ? 'primary' : 'danger'}`} disabled={!confirmed || stale} onClick={onConfirm}>{restoring ? '과목 복원' : '과목 삭제'}</button></footer>
    </dialog>
  )
}
