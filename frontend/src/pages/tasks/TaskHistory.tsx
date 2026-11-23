import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { HistoryTimeline } from '@/features/history/components/HistoryTimeline'
import { filterHistory, historyKindLabels } from '@/features/history/model'
import type { HistoryKind, HistoryRecord } from '@/features/history/model'
import type { TaskPreview } from '@/features/tasks/model'
import './TaskHistory.css'

export function TaskHistory({ task, records }: { task: TaskPreview; records: HistoryRecord[] }) {
  const [kind, setKind] = useState<HistoryKind | 'all'>('all')
  const all = filterHistory(records, task.id, 'all')
  const filtered = filterHistory(records, task.id, kind)
  const sourceLinks = Object.fromEntries(all.flatMap(record => record.source?.noticeId && record.source.availability === 'available'
    ? [[record.source.noticeId, `#/notices/${record.source.noticeId}`]] : []))
  const taskHref = `#/tasks/${task.id}`
  return (
    <>
      <a className="history-back-link" href={taskHref}><Icon name="back" size={14} />과제 상세로</a>
      <div className="page-heading"><div><h1>변경 이력</h1><p>언제, 어떤 내용을 근거로 바뀌었는지 확인하세요.</p></div></div>
      <div className="history-preview-note"><Icon name="info" size={17} /><div><strong>이 탭의 과제 변경 이력</strong><p>과제 등록·직접 수정·공지 검토를 기록합니다. 예시 초기 값과 이후 작업을 함께 표시하며 새로고침하면 초기화됩니다.</p></div></div>
      <section className="panel history-task-context" aria-label="이력을 확인하는 과제">
        <span className={`history-course-icon ${task.tone}`}><Icon name="file" size={19} /></span>
        <div><h2>{task.title}</h2><p>{task.course} · {task.section}분반</p></div><a href={taskHref}>과제 보기<Icon name="arrow" size={13} /></a>
      </section>
      {all.length > 0 && (
        <div className="history-controls"><div className="history-filter-tabs" role="group" aria-label="이력 유형">
          {([['all', '전체'], ...Object.entries(historyKindLabels)] as [HistoryKind | 'all', string][]).map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} className={kind === value ? 'active' : ''} onClick={() => setKind(value)}>{label}<span>{filterHistory(records, task.id, value).length}</span></button>)}
        </div><p role="status">{filtered.length}개 기록 · 최신순 · 한국 표준시 (UTC+9)</p></div>
      )}
      {filtered.length ? <HistoryTimeline records={filtered} sourceLinks={sourceLinks} /> : (
        <section className="panel history-empty"><span><Icon name="clock" size={28} /></span><h2>{all.length ? '이 유형의 기록이 없어요.' : '아직 기록된 변경 이력이 없어요.'}</h2><p>{all.length ? '다른 유형을 선택해 기록을 확인해 보세요.' : '과제를 등록·수정하거나 공지 검토를 완료하면 이곳에 기록합니다.'}</p>
          {all.length ? <button className="button secondary" type="button" onClick={() => setKind('all')}>전체 이력 보기</button> : <a className="button secondary" href={taskHref}>과제 상세로</a>}
        </section>
      )}
      <p className="history-footer-note"><Icon name="shield" size={14} />이 탭의 변경 기록 · 이력 조회는 현재 과제 값을 변경하지 않습니다.</p>
    </>
  )
}
