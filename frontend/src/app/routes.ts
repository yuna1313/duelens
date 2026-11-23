export type TaskMode = 'list' | 'create' | 'detail' | 'edit' | 'history'
export type SettingsTab = 'reminders' | 'data' | 'privacy'
type BasicPage = 'start' | 'courses' | 'notifications' | 'connection' | 'not-found'
export type AppRoute =
  | { page: BasicPage; title: string }
  | { page: 'tasks'; title: string; taskId: string | null; mode: TaskMode }
  | { page: 'notices'; title: string; noticeId: string | null }
  | { page: 'reviews'; title: string; reviewId: string | null }
  | { page: 'settings'; title: string; tab: SettingsTab }

const taskTitles: Record<TaskMode, string> = { list: '내 과제', create: '과제 등록', detail: '과제 상세', edit: '과제 수정', history: '변경 이력' }

export function parseRoute(hash: string): AppRoute {
  if (!hash || hash === '#/' || hash === '#/start' || hash === '#/start/') return { page: 'start', title: '시작 안내' }
  const path = hash.endsWith('/') ? hash.slice(0, -1) : hash
  if (path === '#/courses') return { page: 'courses', title: '과목·수업' }
  if (path === '#/notifications') return { page: 'notifications', title: '알림센터' }
  if (path === '#/connection') return { page: 'connection', title: '학교 연결·수집 관리' }
  if (path === '#/settings' || path === '#/settings/data' || path === '#/settings/privacy') {
    return { page: 'settings', title: '설정·데이터 관리', tab: path.endsWith('/data') ? 'data' : path.endsWith('/privacy') ? 'privacy' : 'reminders' }
  }
  if (path === '#/tasks' || path === '#/tasks/new') {
    const mode = path === '#/tasks' ? 'list' : 'create'
    return { page: 'tasks', title: taskTitles[mode], taskId: null, mode }
  }
  const task = /^#\/tasks\/([a-zA-Z0-9_-]{1,128})(?:\/(edit|history))?$/.exec(path)
  if (task && task[1] !== 'new') {
    const mode = (task[2] ?? 'detail') as 'detail' | 'edit' | 'history'
    return { page: 'tasks', title: taskTitles[mode], taskId: task[1], mode }
  }
  const notice = /^#\/notices(?:\/([a-zA-Z0-9_-]{1,128}))?$/.exec(path)
  if (notice) return { page: 'notices', title: notice[1] ? '공지 원문' : '공지함', noticeId: notice[1] ?? null }
  const review = /^#\/reviews(?:\/([a-zA-Z0-9_-]{1,128}))?$/.exec(path)
  if (review) return { page: 'reviews', title: '변경 검토', reviewId: review[1] ?? null }
  return { page: 'not-found', title: '페이지를 찾을 수 없음' }
}
