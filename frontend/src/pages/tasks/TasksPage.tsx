import { useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { createPreviewTasks } from '@/mocks/tasks'
import { createPreviewHistory } from '@/mocks/history'
import { currentWeek, dateLabel, seoulDateKey } from '@/utils/date'
import { filterTasks, statusLabels, taskDraft, TaskError, taskGroup, taskGroups, upsertTask } from '@/features/tasks/model'
import { TaskFormDialog } from '@/features/tasks/components/TaskFormDialog'
import type { SaveTaskResult, TaskDraft, TaskPreview, TaskStatus } from '@/features/tasks/model'
import { TaskDetail } from './TaskDetail'
import { TaskHistory } from './TaskHistory'
import './TasksPage.css'

function TaskRow({ task, today }: { task: TaskPreview; today: string }) {
  const group = taskGroup(task, today)
  return (
    <li>
      <a
        href={`#/tasks/${task.id}`} className={`task-row ${task.status === 'submitted' ? 'is-submitted' : ''}`}
        aria-label={`${task.course} ${task.section}분반, ${task.title}, ${statusLabels[task.status]}, ${task.dueDate ? dateLabel(task.dueDate) : '마감 날짜 미정'}, ${task.dueTime ?? '시각 미정'}`}
      >
        <span className={`task-progress ${task.status}`}>
          {(task.status === 'written' || task.status === 'submitted') && <Icon name="check" size={12} />}
        </span>
        <span className="task-row-main">
          <span className="task-course"><span className={`task-course-dot ${task.tone}`} />{task.course} · {task.section}분반</span>
          <span className="task-title">{task.title}</span>
        </span>
        <span className={`task-status ${task.status}`}>{statusLabels[task.status]}</span>
        <span className={`task-due ${group}`}>
          <strong>{group === 'today' ? task.dueTime ?? '시각 미정' : task.dueDate ? dateLabel(task.dueDate) : '마감 미정'}</strong>
          <small>{group === 'today' ? '오늘 마감' : task.dueDate ? task.dueTime ?? '시각 확인 필요' : '날짜 확인 필요'}</small>
        </span>
      </a>
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

interface Props { taskId: string | null; mode: 'list' | 'create' | 'detail' | 'edit' | 'history' }

export function TasksPage({ taskId, mode }: Props) {
  const [today] = useState(seoulDateKey)
  const [tasks, setTasks] = useState(() => createPreviewTasks(today))
  const [history] = useState(() => createPreviewHistory(today))
  const [showPreview, setShowPreview] = useState(true)
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [notice, setNotice] = useState('')
  const [failure, setFailure] = useState('')
  const source = tasks.filter(task => showPreview || task.source === 'manual')
  const filtered = filterTasks(source, query, course, status)
  const selected = tasks.find(task => task.id === taskId)
  const courses = [...new Set(source.map(task => task.course))].sort((a, b) => a.localeCompare(b, 'ko'))
  const pending = source.filter(task => task.status !== 'submitted')
  const week = currentWeek(today)
  const dueToday = pending.filter(task => task.dueDate === today).length
  const written = pending.filter(task => task.status === 'written').length
  const [year, month] = today.split('-').map(Number)
  const semester = `${month < 3 ? year - 1 : year}년 ${month >= 3 && month <= 8 ? 1 : 2}학기`

  function resetFilters() { setQuery(''); setCourse('all'); setStatus('all') }

  function saveTask(draft: TaskDraft, id?: string): SaveTaskResult {
    try {
      const result = upsertTask(tasks, draft, id ?? crypto.randomUUID())
      setTasks(result.tasks)
      return { ok: true, task: result.task }
    } catch (error) {
      const problem = error instanceof TaskError ? error : new TaskError('과제를 적용하지 못했습니다. 입력 내용은 이 창에 남아 있습니다.')
      return { ok: false, fields: problem.fields, message: problem.message }
    }
  }

  const pageTitle = { list: '내 과제', create: '과제 등록', detail: '과제 상세', edit: '과제 수정', history: '변경 이력' }[mode]
  return (
    <WorkspaceLayout semester={semester} activePage="tasks" pageTitle={pageTitle}>
      {mode === 'detail' || mode === 'edit' || mode === 'history' ? selected ? (
        mode === 'history' ? <TaskHistory key={selected.id} task={selected} records={history} /> : <TaskDetail task={selected} onStatusChange={nextStatus => {
          const result = saveTask({ ...taskDraft(selected), status: nextStatus }, selected.id)
          if (result.ok) {
            setFailure('')
            setNotice(`진행 상태를 ‘${statusLabels[nextStatus]}’로 표시했습니다. 실제 학교 제출은 수행하지 않았습니다.`)
          } else { setNotice(''); setFailure(result.message) }
        }} />
      ) : (
        <section className="panel task-empty">
          <span><Icon name="book" size={28} /></span><h1>이 과제를 찾을 수 없어요.</h1>
          <p>직접 입력한 과제는 내 과제를 벗어나거나 새로고침하면 초기화됩니다.</p>
          <a className="button secondary" href="#/tasks">내 과제 목록으로</a>
        </section>
      ) : <>
      <div className="page-heading task-page-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE ORGANIZED</span>
          <h1>내 과제</h1>
          <p>{dueToday ? `오늘 마감 ${dueToday}개, 제출까지 잊지 말고 확인하세요.` : '할 일을 한곳에 모으고 차근차근 시작하세요.'}</p>
        </div>
        <a href="#/tasks/new" className="button primary task-add-link"><Icon name="plus" size={16} />과제 추가</a>
      </div>
      <section className="task-preview-banner" aria-label="화면 미리보기 안내">
        <span className="task-preview-icon"><Icon name="info" size={19} /></span>
        <div><strong>과제 화면 미리보기</strong><p>예시 과제를 살펴보거나 직접 추가할 수 있습니다. 입력·변경 내용은 현재 내 과제 화면에서만 유지됩니다.</p></div>
        <button type="button" className="button secondary" onClick={() => {
          setShowPreview(value => !value); resetFilters(); setNotice(''); setFailure('')
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
                <ul>{items.map(task => <TaskRow key={task.id} task={task} today={today} />)}</ul>
              </section>
            )
          }) : (
            <section className="panel task-empty">
              <span><Icon name={source.length ? 'search' : 'book'} size={28} /></span>
              <h2>{source.length ? '검색 조건에 맞는 과제가 없어요.' : '아직 등록된 과제가 없어요.'}</h2>
              <p>{source.length ? '다른 검색어나 필터로 다시 찾아보세요.' : '과제를 직접 추가하고 할 일을 정리해 보세요.'}</p>
              {source.length ? <button className="button secondary" type="button" onClick={resetFilters}>필터 초기화</button>
                : <a className="button secondary" href="#/tasks/new"><Icon name="plus" size={15} />첫 과제 추가</a>}
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
      </>}
      {notice && <p className="task-save-notice" role="status"><Icon name="check" size={15} />{notice}</p>}
      {failure && <p className="task-operation-error" role="alert">{failure}</p>}
      <p className="task-footer-note"><Icon name="clock" size={14} />한국 표준시 (UTC+9) · 내 과제를 벗어나거나 새로고침하면 입력·변경 내용이 초기화됩니다. 학교 제출·서버 저장은 수행하지 않습니다.</p>
      {(mode === 'create' || (mode === 'edit' && selected)) && (
        <TaskFormDialog
          key={selected?.id ?? 'new'} task={mode === 'edit' ? selected : undefined}
          courses={[...new Set(tasks.map(task => task.course))]}
          onCancel={() => { window.location.hash = mode === 'edit' && selected ? `/tasks/${selected.id}` : '/tasks' }}
          onSave={saveTask}
          onSaved={task => {
            resetFilters()
            setFailure('')
            setNotice(mode === 'edit' ? '변경 내용을 과제 화면에 적용했습니다. 서버에 저장되지는 않습니다.' : '과제를 추가했습니다. 현재 내 과제 화면에서만 유지됩니다.')
            window.location.hash = `/tasks/${task.id}`
          }}
        />
      )}
    </WorkspaceLayout>
  )
}
