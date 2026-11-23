import { useEffect, useSyncExternalStore } from 'react'
import { CoursesPage } from '@/pages/courses/CoursesPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { NoticesPage } from '@/pages/notices/NoticesPage'
import { ReviewPage } from '@/pages/reviews/ReviewPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { StartPage } from '@/pages/start/StartPage'

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

const currentHash = () => window.location.hash

function App() {
  const hash = useSyncExternalStore(subscribe, currentHash)
  const page = !hash || hash === '#/' || hash === '#/start' ? 'start' : hash === '#/courses' ? 'courses' : hash === '#/notifications' ? 'notifications' : hash === '#/reviews' || hash.startsWith('#/reviews/') ? 'reviews' : hash === '#/notices' || hash.startsWith('#/notices/') ? 'notices' : 'tasks'
  const noticeId = hash.startsWith('#/notices/') ? hash.slice('#/notices/'.length) : null
  const reviewId = hash.startsWith('#/reviews/') ? hash.slice('#/reviews/'.length) : null
  const taskPath = hash.startsWith('#/tasks/') ? hash.slice('#/tasks/'.length) : ''
  const taskMode = taskPath === 'new' ? 'create' : taskPath.endsWith('/edit') ? 'edit' : taskPath.endsWith('/history') ? 'history' : taskPath ? 'detail' : 'list'
  const taskId = taskMode === 'detail' ? taskPath : taskMode === 'edit' || taskMode === 'history' ? taskPath.slice(0, taskPath.lastIndexOf('/')) : null
  const taskTitle = { list: '내 과제', create: '과제 등록', detail: '과제 상세', edit: '과제 수정', history: '변경 이력' }[taskMode]
  const title = page === 'tasks' ? taskTitle : page === 'notices' && noticeId ? '공지 원문' : { start: '시작 안내', courses: '과목·수업', notices: '공지함', reviews: '변경 검토', notifications: '알림센터' }[page]
  useEffect(() => {
    document.title = `${title} — DueLens`
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [title, noticeId, taskId, reviewId])
  if (page === 'start') return <StartPage />
  if (page === 'courses') return <CoursesPage />
  if (page === 'notices') return <NoticesPage noticeId={noticeId} />
  if (page === 'reviews') return <ReviewPage reviewId={reviewId} />
  if (page === 'notifications') return <NotificationsPage />
  return <TasksPage taskId={taskId} mode={taskMode} />
}

export default App
