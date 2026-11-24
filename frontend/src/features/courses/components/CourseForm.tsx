import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { courseDraft, emptyDraft, validateDraft, weekdays } from '../model'
import type { Course, CourseDraft, CourseErrors } from '../model'
import type { SaveResult } from '../hooks/useCourses'
import { semesters } from '@/domain/academicTerm'
import type { Semester } from '@/domain/academicTerm'
import { Icon } from '@/components/ui/Icon'
import './CourseForm.css'

interface Props {
  term: string
  course?: Course
  onSave: (draft: CourseDraft, id?: string, revision?: number) => SaveResult
  onSaved: (course: Course) => void
  onCancel: () => void
}

export function CourseForm({ term, course, onSave, onSaved, onCancel }: Props) {
  const prefix = useId()
  const [draft, setDraft] = useState(() => course ? courseDraft(course) : emptyDraft(term))
  const [revision, setRevision] = useState(course?.revision)
  const [errors, setErrors] = useState<CourseErrors>({})
  const [message, setMessage] = useState('')

  function update<K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) {
    setDraft(previous => ({ ...previous, [key]: value }))
    setErrors(previous => ({ ...previous, [key]: undefined }))
    setMessage('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = validateDraft(draft)
    setErrors(fields)
    if (Object.keys(fields).length) {
      setMessage('입력 내용을 확인해 주세요.')
      return
    }
    const result = onSave(draft, course?.id, revision)
    if (!result.ok) {
      setErrors(result.fields)
      setMessage(result.message)
      return
    }
    setDraft(courseDraft(result.course))
    setRevision(result.course.revision)
    setMessage('')
    onSaved(result.course)
  }

  const error = (field: keyof CourseDraft) => errors[field]
    ? <p className="field-error" id={`${prefix}-${field}-error`}>{errors[field]}</p>
    : null
  const describedBy = (field: keyof CourseDraft) => errors[field]
    ? `${prefix}-${field}-error`
    : undefined

  return (
    <form className="course-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`${prefix}-year`}>연도 <span className="required-mark">*</span></label>
          <input
            id={`${prefix}-year`} type="number" min="1000" max="9999" required
            value={draft.year} onChange={event => update('year', event.target.value)}
            aria-invalid={Boolean(errors.year)} aria-describedby={describedBy('year')}
          />
          {error('year')}
        </div>
        <div className="form-field">
          <label htmlFor={`${prefix}-semester`}>학기 <span className="required-mark">*</span></label>
          <select
            id={`${prefix}-semester`} value={draft.semester} required
            onChange={event => update('semester', event.target.value as Semester)}
            aria-invalid={Boolean(errors.semester)} aria-describedby={describedBy('semester')}
          >
            {semesters.map(semester => <option key={semester.value} value={semester.value}>{semester.label}</option>)}
          </select>
          {error('semester')}
        </div>
        <div className="form-field">
          <label htmlFor={`${prefix}-name`}>과목명 <span className="required-mark">*</span></label>
          <input
            id={`${prefix}-name`} name="name" value={draft.name} required
            onChange={event => update('name', event.target.value)}
            placeholder="예: 프로그래밍 기초" maxLength={100}
            aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('name')}
          />
          {error('name')}
        </div>
        <div className="form-field">
          <label htmlFor={`${prefix}-section`}>분반 <span className="required-mark">*</span></label>
          <input
            id={`${prefix}-section`} value={draft.section} required
            onChange={event => update('section', event.target.value)}
            placeholder="예: 001" maxLength={30}
            aria-invalid={Boolean(errors.section)} aria-describedby={describedBy('section')}
          />
          {error('section')}
        </div>
      </div>
      <div className="schedule-section">
        <div className="schedule-heading"><h3>수업 시간</h3><span>선택 입력</span></div>
        <p className="form-help">시간표가 정해지지 않았다면 비워 두셔도 됩니다.</p>
        <div className="form-grid schedule-grid">
          <fieldset className="days-field" aria-describedby={describedBy('days')}>
            <legend>요일</legend>
            <div className="day-buttons">
              {weekdays.map((day, index) => (
                <button
                  key={day} type="button"
                  className={`day-button ${draft.days.includes(index + 1) ? 'selected' : ''}`}
                  aria-pressed={draft.days.includes(index + 1)} aria-label={`${day}요일`}
                  onClick={() => update('days', draft.days.includes(index + 1)
                    ? draft.days.filter(value => value !== index + 1)
                    : [...draft.days, index + 1])}
                >{day}</button>
              ))}
            </div>
            {error('days')}
          </fieldset>
          <div className="form-field">
            <label htmlFor={`${prefix}-startTime`}>시작 시각</label>
            <input
              id={`${prefix}-startTime`} type="time" step="60" value={draft.startTime}
              onChange={event => update('startTime', event.target.value)}
              aria-invalid={Boolean(errors.startTime)} aria-describedby={describedBy('startTime')}
            />
            {error('startTime')}
          </div>
        </div>
      </div>
      {message && <p className="form-alert" role="alert">{message}</p>}
      <div className="form-footer">
        <span className="timezone"><Icon name="info" size={14} />한국 표준시 (UTC+9)</span>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onCancel}>취소</button>
          <button type="submit" className="button primary">
            <Icon name="check" size={16} />{course ? '변경 사항 저장' : '과목 등록'}
          </button>
        </div>
      </div>
    </form>
  )
}
