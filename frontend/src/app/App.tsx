import { useEffect, useState, useSyncExternalStore } from 'react'
import { CoursesPage } from '@/pages/courses/CoursesPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { NoticesPage } from '@/pages/notices/NoticesPage'
import { ReviewPage } from '@/pages/reviews/ReviewPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { StartPage } from '@/pages/start/StartPage'
import { ConnectionPage } from '@/pages/connection/ConnectionPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import type { SettingsTab } from '@/pages/settings/SettingsPage'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useReminderPreferences } from '@/features/settings/hooks/useReminderPreferences'
import { termLabel } from '@/features/courses/model'
import { TaskError } from '@/features/tasks/model'
import type { SaveTaskResult, TaskDraft } from '@/features/tasks/model'
import { seoulDateKey } from '@/utils/date'
import { createWorkspaceStore, resolveTaskCourses, reviewTasks } from './workspace'
import { createWorkspacePreview } from './workspacePreview'
import { planReminders } from './reminderPlan'

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

const currentHash = () => window.location.hash

function App() {
  const hash = useSyncExternalStore(subscribe, currentHash)
  const [today] = useState(seoulDateKey)
  const [store] = useState(() => createWorkspaceStore(createWorkspacePreview(today)))
  const workspace = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const courses = useCourses()
  const preferences = useReminderPreferences()
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const tasks = resolveTaskCourses(workspace.tasks, courses.data?.courses ?? [])
  const courseOptions = (courses.data?.courses ?? []).map(course => ({ id: course.id, name: course.name, section: course.section, label: `${termLabel(course.term)} · ${course.name} · ${course.section}분반` }))
  const reminders = preferences.saved && !preferences.error ? planReminders(tasks, preferences.saved.data, now) : []
  const reviewLinks = Object.fromEntries(workspace.notices.flatMap(notice => {
    const related = workspace.candidates.filter(item => item.noticeId === notice.id)
    const candidate = related.find(item => !Object.hasOwn(workspace.results, item.id)) ?? related[0]
    return candidate ? [[notice.id, `#/reviews/${candidate.id}`]] : []
  }))
  function saveTask(draft: TaskDraft, id: string = crypto.randomUUID()): SaveTaskResult {
    try {
      if (courses.error && draft.courseId) throw new TaskError('과목 저장 상태를 확인한 뒤 다시 시도해 주세요.', { courseId: '과목 정보를 읽을 수 없습니다.' })
      return { ok: true, task: store.saveTask(draft, id, new Date().toISOString(), courses.data?.courses ?? []) }
    } catch (error) {
      const problem = error instanceof TaskError ? error : new TaskError('과제를 반영하지 못했습니다. 입력 내용을 확인해 주세요.')
      return { ok: false, message: problem.message, fields: problem.fields }
    }
  }
  const settingsTab: SettingsTab = hash === '#/settings/data' ? 'data' : hash === '#/settings/privacy' ? 'privacy' : 'reminders'
  const page = !hash || hash === '#/' || hash === '#/start' ? 'start' : hash === '#/connection' ? 'connection' : hash === '#/courses' ? 'courses' : hash === '#/notifications' ? 'notifications' : hash === '#/settings' || hash.startsWith('#/settings/') ? 'settings' : hash === '#/reviews' || hash.startsWith('#/reviews/') ? 'reviews' : hash === '#/notices' || hash.startsWith('#/notices/') ? 'notices' : 'tasks'
  const noticeId = hash.startsWith('#/notices/') ? hash.slice('#/notices/'.length) : null
  useEffect(() => {
    if (noticeId && store.getSnapshot().notices.some(item => item.id === noticeId && !item.isRead)) store.setNoticeRead(noticeId, true)
  }, [noticeId, store])
  const reviewId = hash.startsWith('#/reviews/') ? hash.slice('#/reviews/'.length) : null
  const taskPath = hash.startsWith('#/tasks/') ? hash.slice('#/tasks/'.length) : ''
  const taskMode = taskPath === 'new' ? 'create' : taskPath.endsWith('/edit') ? 'edit' : taskPath.endsWith('/history') ? 'history' : taskPath ? 'detail' : 'list'
  const taskId = taskMode === 'detail' ? taskPath : taskMode === 'edit' || taskMode === 'history' ? taskPath.slice(0, taskPath.lastIndexOf('/')) : null
  const taskTitle = { list: '내 과제', create: '과제 등록', detail: '과제 상세', edit: '과제 수정', history: '변경 이력' }[taskMode]
  const title = page === 'tasks' ? taskTitle : page === 'notices' && noticeId ? '공지 원문' : { start: '시작 안내', courses: '과목·수업', notices: '공지함', reviews: '변경 검토', notifications: '알림센터', connection: '학교 연결·수집 관리', settings: '설정·데이터 관리' }[page]
  useEffect(() => {
    document.title = `${title} — DueLens`
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [title, noticeId, taskId, reviewId, settingsTab])
  if (page === 'start') return <StartPage />
  if (page === 'courses') return <CoursesPage controller={courses} />
  if (page === 'notices') return <NoticesPage noticeId={noticeId} today={today} notices={workspace.notices} reviewLinks={reviewLinks} onRead={store.setNoticeRead} onCreate={draft => store.addNotice(draft, crypto.randomUUID(), new Date())} />
  if (page === 'reviews') return <ReviewPage reviewId={reviewId} today={today} candidates={workspace.candidates} tasks={reviewTasks(workspace.tasks)} sources={workspace.notices} results={workspace.results} onApply={(id, draft) => store.applyReview(id, draft, crypto.randomUUID(), new Date().toISOString())} />
  if (page === 'notifications') return <NotificationsPage today={today} notifications={workspace.notifications} reminders={reminders} exampleTaskIds={tasks.filter(task => task.source === 'example').map(task => task.id)} preferenceError={preferences.error} onRead={store.setNotificationRead} onReadAll={store.markNotificationsRead} />
  if (page === 'connection') return <ConnectionPage />
  if (page === 'settings') return <SettingsPage tab={settingsTab} preferences={preferences} onCoursesChanged={courses.reload} />
  return <TasksPage taskId={taskId} mode={taskMode} today={today} tasks={tasks} history={workspace.history} courseOptions={courseOptions} onSave={saveTask} />
}

export default App
