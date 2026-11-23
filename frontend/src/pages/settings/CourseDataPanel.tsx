import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { storageKey } from '@/features/courses/storage'
import { seoulDateKey } from '@/utils/date'
import { createCourseBackup, deleteStoredCourses, maxCourseBackupBytes, readCourseSnapshot, restoreCourseBackup, parseCourseBackup } from './courseBackup'
import type { CourseSnapshot } from './courseBackup'
import { CourseDataDialog } from './CourseDataDialog'
import type { CourseDataReview } from './CourseDataDialog'
import './CourseDataPanel.css'

function loadCourses(): { snapshot: CourseSnapshot | null; error: string } {
  try { return { snapshot: readCourseSnapshot(window.localStorage), error: '' } }
  catch (error) { return { snapshot: null, error: error instanceof Error ? error.message : '과목 정보를 읽을 수 없습니다.' } }
}

export function CourseDataPanel({ onCoursesChanged }: { onCoursesChanged: () => void }) {
  const [source, setSource] = useState(loadCourses)
  const [review, setReview] = useState<CourseDataReview | null>(null)
  const [reviewError, setReviewError] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const loadToken = useRef(0)
  const focusAfterConfirm = useRef(false)
  useEffect(() => {
    const listener = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) setSource(loadCourses()) }
    window.addEventListener('storage', listener)
    return () => { window.removeEventListener('storage', listener); loadToken.current += 1 }
  }, [])
  useEffect(() => {
    if (!review && focusAfterConfirm.current) { focusAfterConfirm.current = false; headingRef.current?.focus({ preventScroll: true }) }
  }, [review])
  function reload() { setSource(loadCourses()); setMessage(''); setError('') }
  function exportBackup() {
    setError(''); setMessage('')
    try {
      const text = createCourseBackup(window.localStorage)
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = `duelens-courses-${seoulDateKey()}.json`
      document.body.append(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('과목 백업 다운로드를 시작했습니다. 다운로드한 파일을 확인해 주세요.')
    } catch (problem) { setError(problem instanceof Error ? problem.message : '백업 파일을 만들지 못했습니다.') }
  }
  async function inspectFile(file: File) {
    const token = ++loadToken.current
    setError(''); setMessage('')
    try {
      if (file.size > maxCourseBackupBytes) throw new Error('과목 백업은 4MB 이하의 JSON 파일만 사용할 수 있습니다.')
      const backup = parseCourseBackup(await file.text())
      if (token !== loadToken.current) return
      const current = readCourseSnapshot(window.localStorage)
      setSource({ snapshot: current, error: '' }); setReviewError('')
      setReview({ kind: 'restore', current, backup, filename: file.name })
    } catch (problem) { if (token === loadToken.current) setError(problem instanceof Error ? problem.message : '백업 파일을 읽지 못했습니다.') }
  }
  function confirm() {
    if (!review) return
    try {
      const snapshot = review.kind === 'restore' ? restoreCourseBackup(window.localStorage, review.backup, review.current.raw) : deleteStoredCourses(window.localStorage, review.current.raw)
      setSource({ snapshot, error: '' }); setError(''); setReviewError('')
      setMessage(review.kind === 'restore' ? `과목 ${snapshot.data.courses.length}개와 선택 학기를 복원했습니다.` : '이 브라우저에 저장한 과목과 선택 학기 정보를 삭제했습니다.')
      focusAfterConfirm.current = true; setReview(null)
      onCoursesChanged()
    } catch (problem) { setReviewError(problem instanceof Error ? problem.message : '과목 데이터를 변경하지 못했습니다.') }
  }
  return (
    <section className="panel course-data-panel" aria-label="과목 데이터 관리">
      <h2 ref={headingRef} tabIndex={-1}>데이터 관리</h2><p className="course-data-panel-lead">현재 백업·복원·삭제 대상은 저장한 과목 정보입니다. 과제·공지·이력 예시와 알림 설정은 백업에 포함하지 않습니다.</p>
      <p className="course-data-summary" role="status">{source.snapshot ? `이 브라우저에 저장한 과목 ${source.snapshot.data.courses.length}개` : '과목 정보를 읽을 수 없습니다.'}</p>
      <div className="course-data-row"><div><h3>과목 백업</h3><p>학기·과목명·분반·시간표를 JSON 파일로 내보냅니다.</p></div><button type="button" className="button secondary" disabled={!source.snapshot} onClick={exportBackup}><Icon name="download" size={14} />내보내기</button></div>
      <div className="course-data-row"><div><h3>과목 백업 가져오기</h3><p>4MB 이하의 백업을 검증한 뒤 교체할 내용을 확인합니다.</p></div><button type="button" className="button secondary" disabled={!source.snapshot} onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} />가져오기</button><input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="과목 백업 파일" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void inspectFile(file) }} /></div>
      <div className="course-data-row"><div><h3>저장한 과목 삭제</h3><p>이 브라우저의 과목만 삭제합니다. 필요한 기록은 먼저 백업해 주세요.</p></div><button type="button" className="button secondary course-data-delete" disabled={!source.snapshot || !source.snapshot.data.courses.length} onClick={() => {
        try { const current = readCourseSnapshot(window.localStorage); setSource({ snapshot: current, error: '' }); setReviewError(''); setReview({ kind: 'delete', current }) }
        catch (problem) { setError(problem instanceof Error ? problem.message : '과목 정보를 읽을 수 없습니다.') }
      }}>과목 삭제</button></div>
      {(source.error || error) && <p className="course-data-error" role="alert">{source.error || error}</p>}
      {message && <p className="course-data-message" role="status"><Icon name="check" size={14} />{message}</p>}
      <button type="button" className="course-data-reload" onClick={reload}>과목 정보 다시 불러오기</button>
      {review && <CourseDataDialog review={review} stale={!source.snapshot || source.snapshot.raw !== review.current.raw} error={reviewError} onClose={() => { setReview(null); setReviewError('') }} onConfirm={confirm} />}
    </section>
  )
}
