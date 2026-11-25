import { useEffect, useState, useSyncExternalStore } from 'react'
import { CoursesPage } from '@/pages/courses/CoursesPage'
import { TaskCourseSetupPage } from '@/pages/tasks/TaskCourseSetupPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { NoticesPage } from '@/pages/notices/NoticesPage'
import { ReviewPage } from '@/pages/reviews/ReviewPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { StartPage } from '@/pages/start/StartPage'
import { TermSetupPage } from '@/pages/start/TermSetupPage'
import { ConnectionPage } from '@/pages/connection/ConnectionPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useReminderPreferences } from '@/features/settings/hooks/useReminderPreferences'
import { currentTerm, isTerm } from '@/domain/academicTerm'
import { AcademicTermContext } from '@/contexts/AcademicTermContext'
import { TaskError } from '@/features/tasks/model'
import type { SaveTaskResult, TaskDraft } from '@/features/tasks/model'
import { seoulDateKey } from '@/utils/date'
import { createWorkspaceStore, resolveTaskCourses, reviewTasks } from './workspace'
import { createPreviewCourses } from '@/mocks/courses'
import { createWorkspacePreview } from './workspacePreview'
import { planReminders } from './reminderPlan'
import { parseRoute } from './routes'
import { usePreviewClock } from './usePreviewClock'

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

const currentHash = () => window.location.hash

function App() {
  const hash = useSyncExternalStore(subscribe, currentHash)
  const route = parseRoute(hash)
  const now = usePreviewClock()
  const today = seoulDateKey(new Date(now))
  const [store] = useState(() => createWorkspaceStore(createWorkspacePreview(today)))
  const [exampleCourses] = useState(() => createPreviewCourses(today))
  const [previewTerm, setPreviewTerm] = useState<string | null>(null)
  const workspace = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const courses = useCourses()
  const preferences = useReminderPreferences()
  const savedTerm = courses.data?.selectedTerm ?? null
  const selectedTerm = savedTerm ?? previewTerm
  const registeredCourses = courses.data?.courses ?? []
  const tasks = resolveTaskCourses(workspace.tasks, [...registeredCourses, ...exampleCourses])
  const activeTasks = tasks.filter(task => task.term === selectedTerm)
  const notices = workspace.notices.filter(notice => notice.term === selectedTerm)
  const candidates = workspace.candidates.filter(candidate => candidate.term === selectedTerm)
  const notifications = workspace.notifications.filter(item => item.term === selectedTerm)
  const selectedTask = route.page === 'tasks' ? tasks.find(task => task.id === route.taskId) : undefined
  const taskCourses = selectedTask?.source === 'example' ? exampleCourses : registeredCourses
  const courseOptions = taskCourses.filter(course => course.term === selectedTerm).map(course => ({ id: course.id, term: course.term, name: course.name, section: course.section, label: `${selectedTask?.source === 'example' ? '예시 · ' : ''}${course.name} · ${course.section}분반` }))
  const reminders = preferences.saved && !preferences.error ? planReminders(activeTasks, preferences.saved.data, now) : []
  const reviewLinks = Object.fromEntries(workspace.notices.flatMap(notice => {
    const related = workspace.candidates.filter(item => item.noticeId === notice.id)
    const candidate = related.find(item => !Object.hasOwn(workspace.results, item.id)) ?? related[0]
    return candidate ? [[notice.id, `#/reviews/${candidate.id}`]] : []
  }))
  function saveTask(draft: TaskDraft, id: string = crypto.randomUUID()): SaveTaskResult {
    try {
      const term = draft.term ?? selectedTerm
      if (!isTerm(term) || (!savedTerm && !workspace.tasks.some(task => task.id === id && task.source === 'example'))) throw new TaskError('과제를 등록할 학기를 먼저 선택해 주세요.', { term: '과제를 등록할 학기를 먼저 선택해 주세요.' })
      const example = workspace.tasks.some(task => task.id === id && task.source === 'example')
      if (courses.error && !example) throw new TaskError('과목 저장 상태를 확인한 뒤 다시 시도해 주세요.', { courseId: '과목 정보를 읽을 수 없습니다.' })
      return { ok: true, task: store.saveTask({ ...draft, term }, id, new Date().toISOString(), example ? exampleCourses : registeredCourses) }
    } catch (error) {
      const problem = error instanceof TaskError ? error : new TaskError('과제를 반영하지 못했습니다. 입력 내용을 확인해 주세요.')
      return { ok: false, message: problem.message, fields: problem.fields }
    }
  }
  const noticeId = route.page === 'notices' ? route.noticeId : null
  useEffect(() => {
    if (noticeId && store.getSnapshot().notices.some(item => item.id === noticeId && item.term === selectedTerm && !item.isRead)) store.setNoticeRead(noticeId, true)
  }, [noticeId, selectedTerm, store])
  const title = route.title
  useEffect(() => {
    document.title = `${title} — DueLens`
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [title, hash])
  function selectTerm(term: string): boolean {
    if (!courses.selectTerm(term)) return false
    setPreviewTerm(null)
    if (route.page === 'tasks' && route.mode !== 'list' && route.mode !== 'create') window.location.hash = '/tasks'
    if (route.page === 'reviews' || (route.page === 'notices' && route.noticeId)) window.location.hash = '/notices'
    return true
  }
  const courseController = { ...courses, save: (...args: Parameters<typeof courses.save>) => {
    const result = courses.save(...args)
    if (result.ok) setPreviewTerm(null)
    return result
  } }
  function renderPage() {
    if (route.page === 'start') return <StartPage selectedTerm={savedTerm} onManualStart={() => setPreviewTerm(null)} onPreview={() => { if (!savedTerm) setPreviewTerm(currentTerm(new Date(now))) }} />
    if (route.page === 'courses') return <CoursesPage key={hash} controller={courseController} adding={route.adding} creatingTask={route.creatingTask} exampleCourses={exampleCourses.filter(course => !selectedTerm || course.term === selectedTerm)} />
    if (route.page === 'connection') return <ConnectionPage />
    if (route.page === 'settings') return <SettingsPage tab={route.tab} preferences={preferences} onCoursesChanged={() => { courses.reload(); setPreviewTerm(null) }} />
    if (route.page === 'not-found') return <NotFoundPage />
    if (route.page === 'tasks' && route.mode === 'create' && !savedTerm && registeredCourses.length > 0) return <TermSetupPage title={route.title} activePage="tasks" enabled={Boolean(courses.data) && !courses.error} error={courses.error} onSelect={selectTerm} />
    if (route.page === 'tasks' && route.mode === 'create' && (!savedTerm || !courseOptions.length)) return <TaskCourseSetupPage term={savedTerm} error={courses.error} />
    if (!selectedTerm) return <TermSetupPage title={route.title} activePage={route.page === 'notifications' ? 'notifications' : route.page === 'tasks' ? 'tasks' : 'notices'} enabled={Boolean(courses.data) && !courses.error} error={courses.error} onSelect={selectTerm} />
    if (route.page === 'notices') return <NoticesPage noticeId={route.noticeId} today={today} notices={notices} reviewLinks={reviewLinks} onRead={store.setNoticeRead} onCreate={draft => store.addNotice({ ...draft, term: selectedTerm }, crypto.randomUUID(), new Date())} />
    if (route.page === 'reviews') return <ReviewPage reviewId={route.reviewId} today={today} candidates={candidates} tasks={reviewTasks(tasks)} sources={notices} results={workspace.results} canCreateTask={candidate => {
      const source = notices.find(notice => notice.id === candidate.noticeId)
      return (source?.source === 'example' ? exampleCourses : registeredCourses).some(course => course.term === candidate.term && course.name === candidate.course && course.section === candidate.section)
    }} onApply={(id, draft) => {
      const candidate = candidates.find(candidate => candidate.id === id)
      const source = notices.find(notice => notice.id === candidate?.noticeId)
      return store.applyReview(id, draft, crypto.randomUUID(), new Date().toISOString(), source?.source === 'example' ? exampleCourses : registeredCourses)
    }} />
    if (route.page === 'notifications') return <NotificationsPage today={today} notifications={notifications} reminders={reminders} exampleTaskIds={activeTasks.filter(task => task.source === 'example').map(task => task.id)} preferenceError={preferences.error} onRead={store.setNotificationRead} onReadAll={store.markNotificationsRead} />
    if (route.page === 'tasks') return <TasksPage taskId={route.taskId} mode={route.mode} today={today} activeTerm={selectedTerm} tasks={activeTasks} history={workspace.history} courseOptions={courseOptions} onSave={saveTask} />
    return <NotFoundPage />
  }
  return <AcademicTermContext value={{ selectedTerm, enabled: Boolean(courses.data) && !courses.error, selectTerm, preview: !savedTerm && previewTerm !== null, exitPreview: () => setPreviewTerm(null) }}>{renderPage()}</AcademicTermContext>
}

export default App
