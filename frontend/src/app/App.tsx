import { useEffect, useState, useSyncExternalStore } from 'react'
import { CoursesPage } from '@/pages/courses/CoursesPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { NoticesPage } from '@/pages/notices/NoticesPage'
import { ReviewPage } from '@/pages/reviews/ReviewPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { StartPage } from '@/pages/start/StartPage'
import { ConnectionPage } from '@/pages/connection/ConnectionPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useReminderPreferences } from '@/features/settings/hooks/useReminderPreferences'
import { currentTerm, termLabel } from '@/domain/academicTerm'
import { AcademicTermContext } from '@/contexts/AcademicTermContext'
import { TaskError } from '@/features/tasks/model'
import type { SaveTaskResult, TaskDraft } from '@/features/tasks/model'
import { seoulDateKey } from '@/utils/date'
import { createWorkspaceStore, resolveTaskCourses, reviewTasks } from './workspace'
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
  const now = usePreviewClock()
  const today = seoulDateKey(new Date(now))
  const [store] = useState(() => createWorkspaceStore(createWorkspacePreview(today)))
  const workspace = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const courses = useCourses()
  const preferences = useReminderPreferences()
  const selectedTerm = courses.data?.selectedTerm ?? currentTerm(new Date(now))
  const tasks = resolveTaskCourses(workspace.tasks, courses.data?.courses ?? [])
  const activeTasks = tasks.filter(task => task.term === selectedTerm)
  const notices = workspace.notices.filter(notice => notice.term === selectedTerm)
  const candidates = workspace.candidates.filter(candidate => candidate.term === selectedTerm)
  const notifications = workspace.notifications.filter(item => item.term === selectedTerm)
  const courseOptions = (courses.data?.courses ?? []).filter(course => course.term === selectedTerm).map(course => ({ id: course.id, term: course.term, name: course.name, section: course.section, label: `${termLabel(course.term)} · ${course.name} · ${course.section}분반` }))
  const reminders = preferences.saved && !preferences.error ? planReminders(activeTasks, preferences.saved.data, now) : []
  const reviewLinks = Object.fromEntries(workspace.notices.flatMap(notice => {
    const related = workspace.candidates.filter(item => item.noticeId === notice.id)
    const candidate = related.find(item => !Object.hasOwn(workspace.results, item.id)) ?? related[0]
    return candidate ? [[notice.id, `#/reviews/${candidate.id}`]] : []
  }))
  function saveTask(draft: TaskDraft, id: string = crypto.randomUUID()): SaveTaskResult {
    try {
      if (courses.error && draft.courseId) throw new TaskError('과목 저장 상태를 확인한 뒤 다시 시도해 주세요.', { courseId: '과목 정보를 읽을 수 없습니다.' })
      return { ok: true, task: store.saveTask({ ...draft, term: draft.term ?? selectedTerm }, id, new Date().toISOString(), courses.data?.courses ?? []) }
    } catch (error) {
      const problem = error instanceof TaskError ? error : new TaskError('과제를 반영하지 못했습니다. 입력 내용을 확인해 주세요.')
      return { ok: false, message: problem.message, fields: problem.fields }
    }
  }
  const route = parseRoute(hash)
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
    if (route.page === 'tasks' && route.mode !== 'list') window.location.hash = '/tasks'
    if (route.page === 'reviews' || (route.page === 'notices' && route.noticeId)) window.location.hash = '/notices'
    return true
  }
  function renderPage() {
    if (route.page === 'start') return <StartPage />
    if (route.page === 'courses') return <CoursesPage controller={courses} />
    if (route.page === 'notices') return <NoticesPage noticeId={route.noticeId} today={today} notices={notices} reviewLinks={reviewLinks} onRead={store.setNoticeRead} onCreate={draft => store.addNotice({ ...draft, term: selectedTerm }, crypto.randomUUID(), new Date())} />
    if (route.page === 'reviews') return <ReviewPage reviewId={route.reviewId} today={today} candidates={candidates} tasks={reviewTasks(tasks)} sources={notices} results={workspace.results} onApply={(id, draft) => store.applyReview(id, draft, crypto.randomUUID(), new Date().toISOString())} />
    if (route.page === 'notifications') return <NotificationsPage today={today} notifications={notifications} reminders={reminders} exampleTaskIds={activeTasks.filter(task => task.source === 'example').map(task => task.id)} preferenceError={preferences.error} onRead={store.setNotificationRead} onReadAll={store.markNotificationsRead} />
    if (route.page === 'connection') return <ConnectionPage />
    if (route.page === 'settings') return <SettingsPage tab={route.tab} preferences={preferences} onCoursesChanged={courses.reload} />
    if (route.page === 'tasks') return <TasksPage taskId={route.taskId} mode={route.mode} today={today} activeTerm={selectedTerm} tasks={activeTasks} history={workspace.history} courseOptions={courseOptions} onSave={saveTask} />
    return <NotFoundPage />
  }
  return <AcademicTermContext value={{ selectedTerm, enabled: Boolean(courses.data) && !courses.error, selectTerm }}>{renderPage()}</AcademicTermContext>
}

export default App
