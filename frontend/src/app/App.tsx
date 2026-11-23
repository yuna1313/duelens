import { useEffect, useSyncExternalStore } from 'react'
import { CoursesPage } from '@/pages/courses/CoursesPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { NoticesPage } from '@/pages/notices/NoticesPage'

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

const currentHash = () => window.location.hash

function App() {
  const hash = useSyncExternalStore(subscribe, currentHash)
  const page = hash === '#/courses' ? 'courses' : hash === '#/notices' || hash.startsWith('#/notices/') ? 'notices' : 'tasks'
  const noticeId = hash.startsWith('#/notices/') ? hash.slice('#/notices/'.length) : null
  const title = page === 'notices' && noticeId ? '공지 원문' : { courses: '과목·수업', notices: '공지함', tasks: '내 과제' }[page]
  useEffect(() => {
    document.title = `${title} — DueLens`
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [title, noticeId])
  if (page === 'courses') return <CoursesPage />
  if (page === 'notices') return <NoticesPage noticeId={noticeId} />
  return <TasksPage />
}

export default App
