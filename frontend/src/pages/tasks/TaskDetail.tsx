import { Icon } from '@/components/ui/Icon'
import { safeSubmissionUrl, statusLabels } from '@/features/tasks/model'
import type { TaskPreview, TaskStatus } from '@/features/tasks/model'
import { dateLabel } from '@/utils/date'
import './TaskDetail.css'

export function TaskDetail({ task, onStatusChange }: { task: TaskPreview; onStatusChange: (status: TaskStatus) => void }) {
  const submissionUrl = safeSubmissionUrl(task.submissionUrl)
  return (
    <>
      <a className="task-back-link" href="#/tasks"><Icon name="back" size={14} />내 과제 목록으로</a>
      <div className="page-heading task-detail-heading">
        <div><div className="task-detail-title"><h1>{task.title}</h1><span className={`task-status ${task.status}`}>{statusLabels[task.status]}</span></div><p>{task.course} · {task.section}분반 · {task.source === 'example' ? '예시 과제' : '직접 입력'}</p></div>
        <a className="button secondary" href={`#/tasks/${task.id}/edit`}><Icon name="edit" size={15} />수정</a>
      </div>
      <div className="task-detail-layout">
        <div className="task-detail-main">
          <section className="panel task-deadline-panel">
            <p className="task-deadline-label"><Icon name="calendar" size={15} />마감일</p>
            <h2>{task.dueDate ? dateLabel(task.dueDate) : '마감 날짜 미정'}<small>{task.dueTime ?? '시각 미정'}</small></h2>
            <p className="task-deadline-zone">한국 표준시 (UTC+9)</p>
            <dl className="task-properties">
              <div><dt>제출 형식</dt><dd>{task.submissionFormat || '미정'}</dd></div>
              <div><dt>분량</dt><dd>{task.quantity || '미정'}</dd></div>
              <div className="task-link-property"><dt>제출 링크</dt><dd>{submissionUrl ? <a href={submissionUrl} target="_blank" rel="noopener noreferrer">제출 페이지 열기<Icon name="external" size={13} /><small>{submissionUrl}</small></a> : '등록된 링크 없음'}</dd></div>
            </dl>
          </section>
          <section className="panel task-description-panel"><h2>과제 안내·메모</h2><p>{task.description || '아직 입력한 안내나 메모가 없습니다.'}</p></section>
          <a className="panel task-history-link" href={`#/tasks/${task.id}/history`}><Icon name="clock" size={17} /><span><strong>변경 이력</strong><small>버전별 변경 전후와 근거를 확인하세요.</small></span><Icon name="chevron" size={15} /></a>
        </div>
        <aside className="panel task-status-panel">
          <h2>어디까지 진행했나요?</h2>
          <div className="task-status-control" role="group" aria-label="과제 진행 상태">
            {(Object.entries(statusLabels) as [TaskStatus, string][]).map(([status, label]) => (
              <button type="button" key={status} className={task.status === status ? 'active' : ''} aria-pressed={task.status === status} onClick={() => onStatusChange(status)}>{label}</button>
            ))}
          </div>
          <p>작성 완료와 제출 완료를 따로 표시합니다. 이 화면의 상태를 바꿔도 학교에 제출되지는 않습니다.</p>
          <button type="button" className="button primary" disabled={task.status === 'submitted'} onClick={() => onStatusChange('submitted')}><Icon name="check" size={15} />{task.status === 'submitted' ? '제출 완료로 표시됨' : '제출 완료로 표시'}</button>
        </aside>
      </div>
    </>
  )
}
