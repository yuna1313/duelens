import { useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { dateLabel } from '@/utils/date'
import { filterTasks, statusLabels, taskDraft, taskGroup, taskGroups } from '@/features/tasks/model'
import { TaskFormDialog } from '@/features/tasks/components/TaskFormDialog'
import { WeekSchedule } from '@/features/tasks/components/WeekSchedule'
import type { SaveTaskResult, TaskCourseOption, TaskDraft, TaskPreview, TaskStatus } from '@/features/tasks/model'
import type { HistoryRecord } from '@/features/history/model'
import { filterTaskPeriod, taskPeriods, taskPeriodRange, taskSummary } from '@/features/tasks/period'
import type { TaskPeriod } from '@/features/tasks/period'
import { termLabel } from '@/domain/academicTerm'
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

interface Props {
  taskId: string | null; mode: 'list' | 'create' | 'detail' | 'edit' | 'history'
  today: string; activeTerm: string; tasks: TaskPreview[]; history: HistoryRecord[]; courseOptions: TaskCourseOption[]
  onSave: (draft: TaskDraft, id?: string) => SaveTaskResult
}

export function TasksPage({ taskId, mode, today, activeTerm, tasks, history, courseOptions, onSave: saveTask }: Props) {
  const [showPreview, setShowPreview] = useState(true)
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [period, setPeriod] = useState<TaskPeriod>('all')
  const [notice, setNotice] = useState('')
  const [failure, setFailure] = useState('')
  const source = tasks.filter(task => showPreview || task.source === 'manual')
  const selected = tasks.find(task => task.id === taskId)
  const courses = [...new Set(source.map(task => task.course))].sort((a, b) => a.localeCompare(b, 'ko'))
  const selectedCourse = courses.includes(course) ? course : 'all'
  const filtered = filterTasks(filterTaskPeriod(source, period, today), query, selectedCourse, status)
  const summary = taskSummary(filtered)
  const range = taskPeriodRange(period, today)
  const unknownCount = source.filter(task => !task.dueDate).length
  const semester = termLabel(activeTerm)

  function resetFilters() { setQuery(''); setCourse('all'); setStatus('all'); setPeriod('all') }

  return (
    <WorkspaceLayout semester={semester} activePage="tasks">
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
          <p>선택한 학기와 주소를 확인해 주세요. 이 탭의 과제는 새로고침하면 초기화됩니다.</p>
          <a className="button secondary" href="#/tasks">내 과제 목록으로</a>
        </section>
      ) : <>
      <div className="page-heading task-page-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE ORGANIZED</span>
          <h1>내 과제</h1>
          <p>{semester}의 과제를 마감일과 진행 상태로 확인하세요.</p>
        </div>
        <a href="#/tasks/new" className="button primary task-add-link"><Icon name="plus" size={16} />과제 추가</a>
      </div>
      {import.meta.env.DEV && <section className="task-preview-banner" aria-label="화면 미리보기 안내">
        <span className="task-preview-icon"><Icon name="info" size={19} /></span>
        <div><strong>프론트 흐름 미리보기</strong><p>공지 검토·과제·이력이 연결됩니다. 메뉴를 이동해도 입력을 유지하며 새로고침하면 초기화됩니다.</p></div>
        <button type="button" className="button secondary" onClick={() => {
          setShowPreview(value => !value); resetFilters(); setNotice(''); setFailure('')
        }}>{showPreview ? '예시 숨기기' : '예시 보기'}</button>
      </section>}
      <section className="task-period-panel" aria-label="과제 조회 기간">
        <div className="task-period-tabs" role="group" aria-label="조회 기간">{taskPeriods.map(item => <button key={item.id} type="button" aria-pressed={period === item.id} className={period === item.id ? 'active' : ''} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div>
        <p className="task-period-range">{range ? `${range.start} ~ ${range.end} · ${period === 'week' ? '월요일~일요일' : '1일~말일'}` : period === 'undated' ? '마감 날짜가 정해지지 않은 과제' : '선택한 학기의 모든 마감일'} · 마감일 기준 · 한국 표준시</p>
        <p className="task-count-guide">집계와 ‘과제 목록’에는 같은 학기·기간·검색·필터를 적용합니다. 남은 과제는 제출 완료로 표시하지 않은 과제이며, 작성 완료·기한이 지난 미제출도 포함합니다. 제출 완료 건수도 제출 시각이 아닌 과제 마감일로 조회합니다.</p>
        {range && unknownCount > 0 && <p className="task-period-unknown">마감 미정 {unknownCount}개는 기간 조회에서 제외했습니다. <button type="button" onClick={() => setPeriod('undated')}>마감 미정 보기</button></p>}
      </section>
      <dl className="task-stats">
        {[
          ['전체 과제', summary.total], ['남은 과제', summary.remaining],
          ['제출 완료', summary.submitted], ['마감 미정', summary.unknown],
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
          <div className="task-filter-select">
            <select id="task-course-filter" value={selectedCourse} onChange={event => setCourse(event.target.value)}>
              <option value="all">모든 과목</option>
              {courses.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <Icon name="chevron" size={14} />
          </div>
          <label className="sr-only" htmlFor="task-status-filter">상태 필터</label>
          <div className="task-filter-select">
            <select id="task-status-filter" value={status} onChange={event => setStatus(event.target.value as TaskStatus | 'all')}>
              <option value="all">모든 상태</option>
              {(Object.entries(statusLabels) as [TaskStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <Icon name="chevron" size={14} />
          </div>
        </div>
      )}
      <div className="task-content-grid">
        <aside className="task-aside" aria-label="일정 미리보기">
          <WeekSchedule key={activeTerm} today={today} tasks={source} />
          <section className="panel task-study-card">
            <span className="study-check"><Icon name="check" size={20} /></span>
            <h2>작성 완료, 제출도 하셨나요?</h2>
            <p>작성 완료한 과제도 제출 완료로 기록하기 전까지 목록에서 따로 확인할 수 있어요.</p>
            <button type="button" onClick={() => { resetFilters(); setStatus('written') }} disabled={!source.length}>
              작성 완료 과제 보기<Icon name="arrow" size={14} />
            </button>
          </section>
        </aside>
        <div className="task-list-area" aria-label="과제 목록">
          <h2 className="task-list-heading">과제 목록</h2>
          <p className="task-result-count" role="status">{filtered.length}개 과제{query || selectedCourse !== 'all' || status !== 'all' || period !== 'all' ? ' · 필터 적용 중' : ''}</p>
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
              <h2>{source.length ? '조회 조건에 맞는 과제가 없어요.' : '아직 등록된 과제가 없어요.'}</h2>
              <p>{source.length ? '다른 기간·검색어·필터로 다시 찾아보세요.' : '과제를 직접 추가하고 할 일을 정리해 보세요.'}</p>
              {source.length ? <button className="button secondary" type="button" onClick={resetFilters}>필터 초기화</button>
                : <a className="button secondary" href="#/tasks/new"><Icon name="plus" size={15} />첫 과제 추가</a>}
            </section>
          )}
        </div>
      </div>
      </>}
      {notice && <p className="task-save-notice" role="status"><Icon name="check" size={15} />{notice}</p>}
      {failure && <p className="task-operation-error" role="alert">{failure}</p>}
      {selected?.courseId && !courseOptions.some(option => option.id === selected.courseId) && <p className="task-operation-error">연결한 과목이 현재 목록에 없습니다. 과제는 입력 당시 과목명·분반을 보관합니다. 수정에서 과목을 다시 연결할 수 있습니다.</p>}
      <p className="task-footer-note"><Icon name="clock" size={14} />한국 표준시 (UTC+9) · 이 탭에서 메뉴 이동 중 유지되며 새로고침하면 초기화됩니다. 학교 제출·서버 저장은 수행하지 않습니다.</p>
      {(mode === 'create' || (mode === 'edit' && selected)) && (
        <TaskFormDialog
          key={selected?.id ?? 'new'} task={mode === 'edit' ? selected : undefined}
          courses={[...new Set(tasks.map(task => task.course))]}
          courseOptions={courseOptions}
          term={activeTerm}
          onCancel={() => { window.location.hash = mode === 'edit' && selected ? `/tasks/${selected.id}` : '/tasks' }}
          onSave={saveTask}
          onSaved={task => {
            resetFilters()
            setFailure('')
            setNotice(mode === 'edit' ? '변경 내용을 과제와 이력에 반영했습니다. 서버에 저장되지는 않습니다.' : '과제와 최초 등록 이력을 추가했습니다. 이 탭에서 유지됩니다.')
            window.location.hash = `/tasks/${task.id}`
          }}
        />
      )}
    </WorkspaceLayout>
  )
}
