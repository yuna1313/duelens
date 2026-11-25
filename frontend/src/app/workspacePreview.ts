import { createPreviewCourses } from '../mocks/courses.ts'
import { createPreviewTasks } from '../mocks/tasks.ts'
import { createPreviewNotices } from '../mocks/notices.ts'
import { createReviewExamples } from '../mocks/reviews.ts'
import { createPreviewHistory } from '../mocks/history.ts'
import { createPreviewNotifications } from '../mocks/notifications.ts'
import { historyValues } from './workspace.ts'
import type { WorkspaceState } from './workspace.ts'
import { currentTerm } from '../domain/academicTerm.ts'

export function createWorkspacePreview(today: string): WorkspaceState {
  const term = currentTerm(new Date(`${today}T12:00:00+09:00`))
  const examples = createReviewExamples(today)
  const courses = createPreviewCourses(today)
  const tasks = createPreviewTasks(today).map(task => ({ ...task, term }))
  for (const example of examples.tasks) {
    if (!tasks.some(task => task.id === example.id)) tasks.push({
      id: example.id, courseId: courses.find(course => course.name === example.course && course.section === example.section)!.id, term, title: example.title, course: example.course, section: example.section, ...example.values,
      status: 'todo', tone: 'green', source: 'example', description: '연결 대상·직접 수정값 확인을 위한 과제 예시입니다.', submissionUrl: '',
    })
  }
  const originalReport = createPreviewHistory(today).find(record => record.kind === 'created')!
  return {
    tasks, candidates: examples.candidates.map(candidate => ({ ...candidate, term })), notices: createPreviewNotices(today).map(notice => ({ ...notice, term })), results: {},
    history: tasks.map(task => ({
      id: `${task.id}-v1`, taskId: task.id, version: 1, occurredAt: `${today}T00:00:00+09:00`, kind: 'created',
      before: null, after: historyValues(task), note: '화면 시작 시 제공한 예시 과제입니다.',
      source: task.id === 'preview-report' ? originalReport.source : null,
    })),
    notifications: createPreviewNotifications(today).items.map(item => ({ ...item, term, source: 'example' })),
  }
}
