import { useEffect, useSyncExternalStore } from 'react'
import { CoursesPage } from '@/pages/courses/CoursesPage'
import { TasksPage } from '@/pages/tasks/TasksPage'

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

const currentPage = () => window.location.hash === '#/courses' ? 'courses' : 'tasks'

function App() {
  const page = useSyncExternalStore(subscribe, currentPage)
  useEffect(() => {
    document.title = `${page === 'courses' ? '과목·수업' : '내 과제'} — DueLens`
    window.scrollTo(0, 0)
  }, [page])
  return page === 'courses' ? <CoursesPage /> : <TasksPage />
}

export default App
