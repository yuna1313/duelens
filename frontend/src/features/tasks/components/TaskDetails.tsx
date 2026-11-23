import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { dateLabel } from '@/utils/date'
import { statusLabels } from '../model'
import type { TaskPreview, TaskStatus } from '../model'
import './TaskDetails.css'

interface Props {
  task: TaskPreview
  onClose: () => void
  onStatusChange: (status: TaskStatus) => void
}

export function TaskDetails({ task, onClose, onStatusChange }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const statusId = useId()
  const [status, setStatus] = useState(task.status)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef} className="task-dialog" aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose() }}
    >
      <header className="task-dialog-heading">
        <div><span className="eyebrow">TASK PREVIEW</span><p>{task.course} · {task.section}분반</p></div>
        <button type="button" className="icon-button" aria-label="과제 상세 닫기" onClick={onClose}>
          <Icon name="close" size={21} />
        </button>
      </header>
      <h2 id={titleId}>{task.title}</h2>
      <dl className="task-detail-meta">
        <div><dt>마감 날짜</dt><dd>{task.dueDate ? dateLabel(task.dueDate) : '날짜 확인 필요'}</dd></div>
        <div><dt>마감 시각</dt><dd>{task.dueTime ?? '시각 미정'}<small>한국 표준시 (UTC+9)</small></dd></div>
      </dl>
      <section className="task-description"><h3>과제 내용</h3><p>{task.description}</p></section>
      <form onSubmit={event => { event.preventDefault(); onStatusChange(status) }}>
        <label className="task-status-label" htmlFor={statusId}>진행 상태</label>
        <select id={statusId} value={status} onChange={event => setStatus(event.target.value as TaskStatus)}>
          {(Object.entries(statusLabels) as [TaskStatus, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <p className="task-preview-help">예시 과제입니다. 상태 변경은 이 화면에서만 유지되며, 학교에 제출되거나 저장되지 않습니다.</p>
        <footer>
          <button type="button" className="button secondary" onClick={onClose}>닫기</button>
          <button type="submit" className="button primary"><Icon name="check" size={16} />상태 적용</button>
        </footer>
      </form>
    </dialog>
  )
}
