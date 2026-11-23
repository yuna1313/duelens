import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { emptyTaskDraft, statusLabels, taskDraft, validateTaskDraft } from '../model'
import type { SaveTaskResult, TaskDraft, TaskErrors, TaskPreview, TaskStatus } from '../model'
import './TaskFormDialog.css'

interface Props {
  task?: TaskPreview
  courses: string[]
  onCancel: () => void
  onSave: (draft: TaskDraft, id?: string) => SaveTaskResult
  onSaved: (task: TaskPreview) => void
}

export function TaskFormDialog({ task, courses, onCancel, onSave, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const prefix = useId()
  const [draft, setDraft] = useState(() => task ? taskDraft(task) : emptyTaskDraft())
  const [unknownDate, setUnknownDate] = useState(task ? !task.dueDate : false)
  const [errors, setErrors] = useState<TaskErrors>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog?.querySelector('input')?.focus()
    return () => dialog?.close()
  }, [])

  function update<K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) {
    setDraft(previous => ({ ...previous, [field]: value }))
    setErrors(previous => ({ ...previous, [field]: undefined }))
    setMessage('')
  }

  const describedBy = (field: keyof TaskDraft) => errors[field] ? `${prefix}-${field}-error` : undefined
  const error = (field: keyof TaskDraft) => errors[field]
    ? <p className="task-editor-error" id={`${prefix}-${field}-error`}>{errors[field]}</p>
    : null

  return (
    <dialog
      ref={dialogRef} className="task-editor-dialog" aria-labelledby={`${prefix}-heading`}
      onCancel={event => { event.preventDefault(); onCancel() }}
    >
      <header className="task-editor-heading">
        <div><span className="eyebrow">TASK PREVIEW</span><h2 id={`${prefix}-heading`}>{task ? '과제 수정' : '과제 추가'}</h2></div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="과제 입력 닫기"><Icon name="close" size={21} /></button>
      </header>
      <form noValidate onSubmit={event => {
        event.preventDefault()
        const fields = validateTaskDraft(draft)
        setErrors(fields)
        if (Object.keys(fields).length) {
          setMessage('입력 내용을 확인해 주세요.')
          event.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(fields)[0]}"]`)?.focus()
          return
        }
        const result = onSave(draft, task?.id)
        if (result.ok) onSaved(result.task)
        else { setErrors(result.fields); setMessage(result.message) }
      }}>
        <div className="task-editor-body">
          <p className="task-editor-help">화면 미리보기용 입력입니다. 내용은 현재 내 과제 화면에서만 유지되며 서버로 전송하거나 학교에 제출하지 않습니다.</p>
          <div className="task-editor-grid task-editor-course-grid">
            <div className="task-editor-field">
              <label htmlFor={`${prefix}-course`}>과목명 <span>*</span></label>
              <input id={`${prefix}-course`} name="course" list={`${prefix}-courses`} value={draft.course} required maxLength={100} placeholder="과목 선택 또는 직접 입력" onChange={event => update('course', event.target.value)} aria-invalid={Boolean(errors.course)} aria-describedby={describedBy('course')} />
              <datalist id={`${prefix}-courses`}>{courses.map(course => <option key={course} value={course} />)}</datalist>
              {error('course')}
            </div>
            <div className="task-editor-field">
              <label htmlFor={`${prefix}-section`}>분반 <span>*</span></label>
              <input id={`${prefix}-section`} name="section" value={draft.section} required maxLength={30} placeholder="예: 001" onChange={event => update('section', event.target.value)} aria-invalid={Boolean(errors.section)} aria-describedby={describedBy('section')} />
              {error('section')}
            </div>
          </div>
          <div className="task-editor-field">
            <label htmlFor={`${prefix}-title`}>과제명 <span>*</span></label>
            <input id={`${prefix}-title`} name="title" value={draft.title} required maxLength={150} placeholder="어떤 과제를 해야 하나요?" onChange={event => update('title', event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={describedBy('title')} />
            {error('title')}
          </div>
          <div className="task-editor-grid">
            <div className="task-editor-field">
              <label htmlFor={`${prefix}-dueDate`}>마감 날짜</label>
              <input id={`${prefix}-dueDate`} name="dueDate" type="date" min="1000-01-01" max="9999-12-31" value={draft.dueDate} disabled={unknownDate} onChange={event => update('dueDate', event.target.value)} aria-invalid={Boolean(errors.dueDate)} aria-describedby={describedBy('dueDate')} />
              {error('dueDate')}
            </div>
            <div className="task-editor-field">
              <label htmlFor={`${prefix}-dueTime`}>마감 시각</label>
              <input id={`${prefix}-dueTime`} name="dueTime" type="time" step="60" value={draft.dueTime} disabled={unknownDate} onChange={event => update('dueTime', event.target.value)} aria-invalid={Boolean(errors.dueTime)} aria-describedby={describedBy('dueTime')} />
              {error('dueTime')}
            </div>
          </div>
          <label className="task-editor-unknown">
            <input type="checkbox" checked={unknownDate} onChange={event => {
              const checked = event.target.checked
              setUnknownDate(checked)
              if (checked) {
                setDraft(previous => ({ ...previous, dueDate: '', dueTime: '' }))
                setErrors(previous => ({ ...previous, dueDate: undefined, dueTime: undefined }))
                setMessage('')
              }
            }} />마감 날짜를 아직 몰라요
          </label>
          <p className="task-editor-time-help">한국 표준시 (UTC+9) · 시각을 비우면 ‘시각 미정’으로 표시합니다.</p>
          <div className="task-editor-grid">
            {([
              ['submissionFormat', '제출 형식', '예: PDF, 소스 코드'],
              ['quantity', '분량', '예: 5쪽 이내'],
            ] as const).map(([field, label, placeholder]) => (
              <div className="task-editor-field" key={field}>
                <label htmlFor={`${prefix}-${field}`}>{label}</label>
                <input id={`${prefix}-${field}`} name={field} value={draft[field]} maxLength={100} placeholder={placeholder} onChange={event => update(field, event.target.value)} aria-invalid={Boolean(errors[field])} aria-describedby={describedBy(field)} />
                {error(field)}
              </div>
            ))}
          </div>
          <div className="task-editor-field">
            <label htmlFor={`${prefix}-submissionUrl`}>제출 링크</label>
            <input id={`${prefix}-submissionUrl`} name="submissionUrl" type="url" value={draft.submissionUrl} maxLength={2048} placeholder="https://…" onChange={event => update('submissionUrl', event.target.value)} aria-invalid={Boolean(errors.submissionUrl)} aria-describedby={describedBy('submissionUrl')} />
            {error('submissionUrl')}
          </div>
          <div className="task-editor-field">
            <label htmlFor={`${prefix}-description`}>메모</label>
            <textarea id={`${prefix}-description`} name="description" rows={3} value={draft.description} maxLength={20_000} placeholder="과제 안내나 기억할 내용을 적어 주세요." onChange={event => update('description', event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={describedBy('description')} />
            {error('description')}
          </div>
          <div className="task-editor-field">
            <label htmlFor={`${prefix}-status`}>진행 상태</label>
            <select id={`${prefix}-status`} name="status" value={draft.status} onChange={event => update('status', event.target.value as TaskStatus)} aria-invalid={Boolean(errors.status)} aria-describedby={describedBy('status')}>
              {(Object.entries(statusLabels) as [TaskStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {error('status')}
          </div>
          {message && <p className="task-editor-error" role="alert">{message}</p>}
        </div>
        <footer className="task-editor-footer">
          <button type="button" className="button secondary" onClick={onCancel}>취소</button>
          <button type="submit" className="button primary"><Icon name="check" size={15} />{task ? '변경 사항 적용' : '과제 등록'}</button>
        </footer>
      </form>
    </dialog>
  )
}
