import { useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { createPreviewTasks } from '@/features/tasks/previewData'
import { currentWeek, dateLabel, filterTasks, seoulDateKey, statusLabels, taskGroup, taskGroups } from '@/features/tasks/model'
import { TaskDetails } from '@/features/tasks/components/TaskDetails'
import type { TaskPreview, TaskStatus } from '@/features/tasks/model'
import './TasksPage.css'

function TaskRow({ task, today, onSelect }: { task: TaskPreview; today: string; onSelect: () => void }) {
  const group = taskGroup(task, today)
  return (
    <li>
      <button
        type="button" className={`task-row ${task.status === 'submitted' ? 'is-submitted' : ''}`} onClick={onSelect}
        aria-label={`${task.course} ${task.section}분반, ${task.title}, ${statusLabels[task.status]}, ${task.dueDate ? dateLabel(task.dueDate) : '마감 날짜 미정'}, ${task.dueTime ?? '시각 미정'}`}
      >
        <span className={`task-progress ${task.status}`}>
          {(task.status === 'written' || task.status === 'submitted') && <Icon name="check" size={12} />}
        </span>
        <span className="task-row-main">
          <span className="task-course"><span className={`task-course-dot ${task.tone}`} />{task.course}</span>
          <span className="task-title">{task.title}</span>
        </span>
        <span className={`task-status ${task.status}`}>{statusLabels[task.status]}</span>
        <span className={`task-due ${group}`}>
          <strong>{group === 'today' ? task.dueTime ?? '시각 미정' : task.dueDate ? dateLabel(task.dueDate) : '마감 미정'}</strong>
          <small>{group === 'today' ? '오늘 마감' : task.dueDate ? task.dueTime ?? '시각 확인 필요' : '날짜 확인 필요'}</small>
        </span>
      </button>
    </li>
  )
}

function WeekCard({ today, tasks }: { today: string; tasks: TaskPreview[] }) {
  const week = currentWeek(today)
  const days = ['월', '화', '수', '목', '금', '토', '일']
  return (
    <section className="panel task-week-card" aria-label="이번 주 마감 일정">
      <header><h2>이번 주 일정</h2><Icon name="calendar" size={16} /></header>
      <ol className="task-week">
        {week.map((date, index) => {
          const due = tasks.filter(task => task.dueDate === date && task.status !== 'submitted').length
          return (
            <li key={date} className={date === today ? 'is-today' : ''} aria-current={date === today ? 'date' : undefined}>
              <span>{days[index]}</span><b>{Number(date.slice(-2))}</b>
              <span className={`week-marker ${due ? 'has-deadline' : ''}`} aria-label={due ? `미제출 과제 ${due}개` : '마감 없음'} />
            </li>
          )
        })}
      </ol>
      <p>날짜를 확인하고<br />오늘 할 일부터 차근차근 정리해 보세요.</p>
    </section>
  )
}

export function TasksPage() {
  const [today] = useState(seoulDateKey)
  const [tasks, setTasks] = useState(() => createPreviewTasks(today))
  const [showPreview, setShowPreview] = useState(true)
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const source = showPreview ? tasks : []
  const filtered = filterTasks(source, query, course, status)
  const selected = source.find(task => task.id === selectedId)
  const courses = [...new Set(source.map(task => task.course))].sort((a, b) => a.localeCompare(b, 'ko'))
  const pending = source.filter(task => task.status !== 'submitted')
  const week = currentWeek(today)
  const dueToday = pending.filter(task => task.dueDate === today).length
  const written = pending.filter(task => task.status === 'written').length
  const [year, month] = today.split('-').map(Number)
  const semester = `${month < 3 ? year - 1 : year}년 ${month >= 3 && month <= 8 ? 1 : 2}학기`

  function resetFilters() { setQuery(''); setCourse('all'); setStatus('all') }

  return (
    <WorkspaceLayout semester={semester} activePage="tasks">
      <div className="page-heading task-page-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE ORGANIZED</span>
          <h1>내 과제</h1>
          <p>{dueToday ? `오늘 마감 ${dueToday}개, 제출까지 잊지 말고 확인하세요.` : '할 일을 한곳에 모으고 차근차근 시작하세요.'}</p>
        </div>
        <a href="#/courses" className="button secondary task-course-link"><Icon name="book" size={16} />과목 관리</a>
      </div>
      <section className="task-preview-banner" aria-label="화면 미리보기 안내">
        <span className="task-preview-icon"><Icon name="info" size={19} /></span>
        <div><strong>예시 데이터로 보는 화면 미리보기</strong><p>학교 계정과 연결되지 않았습니다. 실제 과제와 공지는 가져오지 않습니다.</p></div>
        <button type="button" className="button secondary" onClick={() => {
          setShowPreview(value => !value); resetFilters(); setNotice(''); setSelectedId(null)
        }}>{showPreview ? '예시 숨기기' : '예시 보기'}</button>
      </section>
      <dl className="task-stats">
        {[
          ['오늘 마감', dueToday],
          ['이번 주 미제출', pending.filter(task => task.dueDate && week.includes(task.dueDate)).length],
          ['마감 날짜 미정', pending.filter(task => !task.dueDate).length],
          ['작성 완료 · 미제출', written],
        ].map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}<small>개</small></dd></div>)}
      </dl>
      {notice && <p className="task-save-notice" role="status"><Icon name="check" size={15} />{notice}</p>}
      {source.length > 0 && (
        <div className="task-filters">
          <div className="task-search">
            <Icon name="search" size={17} />
            <label className="sr-only" htmlFor="task-search">과제 검색</label>
            <input id="task-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="과제명이나 과목을 검색하세요" />
          </div>
          <label className="sr-only" htmlFor="task-course-filter">과목 필터</label>
          <select id="task-course-filter" value={course} onChange={event => setCourse(event.target.value)}>
            <option value="all">모든 과목</option>
            {courses.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="sr-only" htmlFor="task-status-filter">상태 필터</label>
          <select id="task-status-filter" value={status} onChange={event => setStatus(event.target.value as TaskStatus | 'all')}>
            <option value="all">모든 상태</option>
            {(Object.entries(statusLabels) as [TaskStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      )}
      <div className="task-content-grid">
        <div className="task-list-area" aria-label="과제 목록">
          <p className="task-result-count" role="status">{filtered.length}개 과제{query || course !== 'all' || status !== 'all' ? ' · 필터 적용 중' : ''}</p>
          {filtered.length > 0 ? taskGroups.map(group => {
            const items = filtered.filter(task => taskGroup(task, today) === group.id)
            return items.length > 0 && (
              <section className={`task-group group-${group.id}`} key={group.id} aria-label={group.label}>
                <header><h2>{group.label}</h2><span>{items.length}</span></header>
                <ul>{items.map(task => <TaskRow key={task.id} task={task} today={today} onSelect={() => setSelectedId(task.id)} />)}</ul>
              </section>
            )
          }) : (
            <section className="panel task-empty">
              <span><Icon name={source.length ? 'search' : 'book'} size={28} /></span>
              <h2>{source.length ? '검색 조건에 맞는 과제가 없어요.' : '아직 등록된 과제가 없어요.'}</h2>
              <p>{source.length ? '다른 검색어나 필터로 다시 찾아보세요.' : '예시 과제로 목록과 진행 상태를 살펴보세요.'}</p>
              <button className="button secondary" type="button" onClick={source.length ? resetFilters : () => setShowPreview(true)}>
                {source.length ? '필터 초기화' : '예시 과제 보기'}
              </button>
            </section>
          )}
        </div>
        <aside className="task-aside">
          <WeekCard today={today} tasks={source} />
          <section className="panel task-study-card">
            <span className="study-check"><Icon name="check" size={20} /></span>
            <h2>작성 완료, 제출도 하셨나요?</h2>
            <p>작성 완료한 과제도 제출 완료로 기록하기 전까지 목록에서 따로 확인할 수 있어요.</p>
            <button type="button" onClick={() => { resetFilters(); setStatus('written') }} disabled={!source.length}>
              작성 완료 과제 보기<Icon name="arrow" size={14} />
            </button>
          </section>
        </aside>
      </div>
      <p className="task-footer-note"><Icon name="clock" size={14} />한국 표준시 (UTC+9) · 예시 데이터의 변경은 화면 이동·새로고침 시 초기화됩니다.</p>
      {selected && (
        <TaskDetails task={selected} onClose={() => setSelectedId(null)} onStatusChange={nextStatus => {
          setTasks(previous => previous.map(task => task.id === selected.id ? { ...task, status: nextStatus } : task))
          setSelectedId(null)
          setNotice(`예시 과제의 상태를 ‘${statusLabels[nextStatus]}’로 변경했습니다. 실제 제출이나 저장은 수행하지 않았습니다.`)
        }} />
      )}
    </WorkspaceLayout>
  )
}
