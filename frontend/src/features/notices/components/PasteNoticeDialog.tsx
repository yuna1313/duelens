import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { validateNoticeDraft } from '../model'
import type { NoticeDraft, NoticeErrors } from '../model'
import './PasteNoticeDialog.css'

export function PasteNoticeDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (draft: NoticeDraft) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const prefix = useId()
  const [draft, setDraft] = useState<NoticeDraft>({ course: '', title: '', body: '' })
  const [errors, setErrors] = useState<NoticeErrors>({})

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog?.querySelector('input')?.focus()
    return () => dialog?.close()
  }, [])

  function update(field: keyof NoticeDraft, value: string) {
    setDraft(previous => ({ ...previous, [field]: value }))
    setErrors(previous => ({ ...previous, [field]: undefined }))
  }

  return (
    <dialog
      ref={dialogRef} className="paste-notice-dialog" aria-labelledby={`${prefix}-heading`}
      onCancel={event => { event.preventDefault(); onClose() }}
    >
      <header>
        <div><span className="eyebrow">NOTICE PREVIEW</span><h2 id={`${prefix}-heading`}>공지 붙여넣기</h2></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="공지 입력 닫기"><Icon name="close" size={21} /></button>
      </header>
      <p className="paste-notice-help">원문을 입력하고 공지 화면을 확인해 보세요. 등록한 원문은 이 탭의 메뉴 이동 중 유지되고 새로고침하면 초기화됩니다. 서버나 AI로 전송되지 않습니다.</p>
      <form noValidate onSubmit={event => {
        event.preventDefault()
        const nextErrors = validateNoticeDraft(draft)
        setErrors(nextErrors)
        if (!Object.keys(nextErrors).length) onCreate(draft)
      }}>
        {([
          ['course', '과목명', '예: 프로그래밍 기초', 100],
          ['title', '공지 제목', '예: 중간보고서 제출 안내', 150],
        ] as const).map(([field, label, placeholder, maxLength]) => (
          <div className="paste-notice-field" key={field}>
            <label htmlFor={`${prefix}-${field}`}>{label} <span>*</span></label>
            <input
              id={`${prefix}-${field}`} value={draft[field]} required placeholder={placeholder} maxLength={maxLength}
              onChange={event => update(field, event.target.value)} aria-invalid={Boolean(errors[field])}
              aria-describedby={errors[field] ? `${prefix}-${field}-error` : undefined}
            />
            {errors[field] && <p className="paste-notice-error" id={`${prefix}-${field}-error`}>{errors[field]}</p>}
          </div>
        ))}
        <div className="paste-notice-field">
          <label htmlFor={`${prefix}-body`}>공지 원문 <span>*</span></label>
          <textarea
            id={`${prefix}-body`} value={draft.body} required placeholder="공지 내용을 붙여넣어 주세요."
            maxLength={20_000} rows={7} onChange={event => update('body', event.target.value)}
            aria-invalid={Boolean(errors.body)} aria-describedby={`${prefix}-body-help${errors.body ? ` ${prefix}-body-error` : ''}`}
          />
          <small id={`${prefix}-body-help`}>{draft.body.length.toLocaleString('ko-KR')} / 20,000자 · 서식 없이 원문 그대로 표시합니다.</small>
          {errors.body && <p className="paste-notice-error" id={`${prefix}-body-error`}>{errors.body}</p>}
        </div>
        {Object.values(errors).some(Boolean) && <p className="paste-notice-error" role="alert">입력 내용을 확인해 주세요.</p>}
        <footer>
          <button type="button" className="button secondary" onClick={onClose}>취소</button>
          <button type="submit" className="button primary"><Icon name="check" size={15} />원문 미리보기</button>
        </footer>
      </form>
    </dialog>
  )
}
