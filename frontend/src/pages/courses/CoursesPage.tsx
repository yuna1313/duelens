import { useEffect, useId, useRef, useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { CourseForm } from '@/features/courses/components/CourseForm'
import { scheduleLabel } from '@/features/courses/model'
import { termLabel, termOptions } from '@/domain/academicTerm'
import type { useCourses } from '@/features/courses/hooks/useCourses'
import type { Course, CourseDraft } from '@/features/courses/model'
import type { SaveResult } from '@/features/courses/hooks/useCourses'
import './CoursesPage.css'

interface CourseDialogProps {
  term: string | null
  onClose: () => void
  onSave: (draft: CourseDraft, id?: string, revision?: number) => SaveResult
  onSaved: (course: Course) => void
}

function CourseDialog({ term, onClose, onSave, onSaved }: CourseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog?.querySelector<HTMLElement>(term ? 'input[name="name"]' : 'select[name="semester"]')?.focus()
    return () => dialog?.close()
  }, [term])
  return (
    <dialog
      className="course-dialog" ref={dialogRef} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose() }}
    >
      <header className="dialog-header">
        <div>
          <span className="eyebrow">NEW COURSE</span>
          <h2 id={titleId}>새 과목 등록</h2>
          <p>{term ? '과목을 등록하고 이번 학기를 정리해 보세요.' : '연도와 학기를 선택해 첫 과목을 등록해 주세요.'}</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="등록 창 닫기">
          <Icon name="close" size={21} />
        </button>
      </header>
      <div className="dialog-body">
        <CourseForm term={term} onSave={onSave} onSaved={onSaved} onCancel={onClose} />
      </div>
    </dialog>
  )
}

export function CoursesPage({ controller }: { controller: ReturnType<typeof useCourses> }) {
  const { data, error, save, selectTerm, reload } = controller
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorVersion, setEditorVersion] = useState(0)
  const [notice, setNotice] = useState('')
  const editorRef = useRef<HTMLElement>(null)
  const term = data?.selectedTerm ?? null
  const courses = data?.courses ?? []
  const visible = courses
    .filter(course => course.term === term)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.section.localeCompare(b.section, 'ko', { numeric: true }))
  const selected = visible.find(course => course.id === editingId)

  useEffect(() => {
    if (editingId) editorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [editingId])

  function saved(course: Course, isNew: boolean) {
    setAdding(false)
    setEditingId(course.id)
    setNotice(isNew ? '과목을 등록했어요. 이 기기에 저장했습니다.' : '변경 사항을 이 기기에 저장했습니다.')
  }

  return (
    <WorkspaceLayout semester={termLabel(term)}>
      <div className="page-heading">
        <div><h1>과목·수업</h1><p>과목과 수업 시간을 정리해 주세요.</p></div>
        <button
          type="button" className="button primary" disabled={!data}
          onClick={() => { setNotice(''); setAdding(true) }}
        ><Icon name="plus" size={17} />과목 추가</button>
      </div>
      {error && (
        <div className="storage-alert" role="alert">
          <div><strong>저장 정보를 확인해 주세요.</strong><p>{error}</p></div>
          <button type="button" className="button secondary" onClick={reload}>다시 시도</button>
        </div>
      )}
      {notice && <div className="save-notice" role="status"><Icon name="check" size={16} />{notice}</div>}
      <div className="course-filter">
        <label className="sr-only" htmlFor="term-filter">학기 선택</label>
        <select
          id="term-filter" value={term ?? ''} disabled={!data}
          onChange={event => { selectTerm(event.target.value); setEditingId(null); setNotice('') }}
        >
          <option value="" disabled>학기를 선택해 주세요</option>
          {termOptions(term, courses.map(course => course.term)).map(option => (
            <option key={option} value={option}>{termLabel(option)}</option>
          ))}
        </select>
        <span>{visible.length}개 과목</span>
        <span className="storage-caption"><Icon name="shield" size={14} />이 기기에 저장</span>
      </div>
      <section className="panel courses-panel" aria-label="등록한 과목">
        {visible.length > 0 ? (
          <table className="course-table">
            <thead>
              <tr>
                <th scope="col">과목</th><th scope="col">수업 시간</th>
                <th scope="col" className="connection-cell">연결</th>
                <th scope="col" className="manage-heading">관리</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((course, index) => (
                <tr key={course.id} className={selected?.id === course.id ? 'selected-row' : ''}>
                  <td>
                    <div className="course-cell">
                      <span className={`course-monogram tone-${index % 4}`}>{Array.from(course.name)[0]}</span>
                      <div>
                        <button
                          type="button" className="course-name"
                          onClick={() => { setEditingId(course.id); setNotice('') }}
                        >{course.name}</button>
                        <span className="course-section">{course.section}분반</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={course.startTime ? 'schedule-value' : 'schedule-unknown'}>
                      {scheduleLabel(course)}
                    </span>
                  </td>
                  <td className="connection-cell"><span className="source-pill">직접 등록</span></td>
                  <td className="manage-cell">
                    <button
                      type="button" className="icon-button"
                      onClick={() => { setEditingId(course.id); setNotice('') }}
                      aria-label={`${course.name} ${course.section}분반 수정`}
                    ><Icon name="edit" size={17} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="courses-empty">
            <span className="empty-symbol"><Icon name="book" size={28} /></span>
            <h2>{term === null ? '첫 과목과 사용할 학기를 함께 정해 주세요.' : courses.length ? '이 학기에는 등록된 과목이 없어요.' : '이번 학기, 첫 과목을 등록해 보세요.'}</h2>
            <p>{term === null ? '위에서 학기만 먼저 선택하거나, 과목 등록에서 연도와 학기를 함께 선택할 수 있어요.' : courses.length ? '다른 학기를 선택하거나 새 과목을 추가해 주세요.' : '학교 연결 없이 과목과 수업 시간을 직접 관리할 수 있어요.'}</p>
            <button type="button" className="button secondary" disabled={!data} onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} />첫 과목 등록
            </button>
          </div>
        )}
      </section>
      <p className="schedule-note">
        <Icon name="info" size={15} />수업 시간은 ‘다음 수업 전까지’ 같은 마감 표현을 해석할 때 사용해요.
      </p>
      {selected ? (
        <section className="panel editor-panel" ref={editorRef}>
          <header className="editor-header">
            <div><span className="eyebrow">COURSE DETAILS</span><h2>과목·수업 정보 수정</h2></div>
            <span className="editing-pill" title={selected.name}>{selected.name}</span>
          </header>
          <CourseForm
            key={`${selected.id}-${editorVersion}`} course={selected} term={term} onSave={save}
            onSaved={course => saved(course, false)} onCancel={() => setEditingId(null)}
          />
          <button
            className="reload-editor" type="button"
            onClick={() => { reload(); setEditorVersion(value => value + 1); setNotice('') }}
          >저장된 내용 다시 불러오기</button>
        </section>
      ) : visible.length > 0 && (
        <div className="editor-hint">
          <Icon name="edit" size={18} />
          <div><strong>수업 정보를 수정할 수 있어요.</strong><p>위 목록에서 과목명이나 수정 버튼을 선택해 주세요.</p></div>
        </div>
      )}
      <p className="local-data-note">
        <Icon name="shield" size={15} />
        <span>과목 정보는 현재 브라우저에 저장됩니다. 브라우저 데이터를 지우면 기록도 삭제됩니다.</span>
      </p>
      {adding && (
        <CourseDialog term={term} onSave={save} onClose={() => setAdding(false)} onSaved={course => saved(course, true)} />
      )}
    </WorkspaceLayout>
  )
}
