import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyWorkspaceReview, createWorkspaceStore, historyValues, resolveTaskCourses, reviewTasks, saveWorkspaceTask } from '../src/app/workspace.ts'
import { createPreviewCourses } from '../src/mocks/courses.ts'
import { createWorkspacePreview } from '../src/app/workspacePreview.ts'
import { initialReviewDraft } from '../src/features/reviews/model.ts'
import { emptyTaskDraft, taskDraft } from '../src/features/tasks/model.ts'
import type { Course } from '../src/features/courses/model.ts'

const today = '2026-11-24'
const now = '2026-11-24T08:00:00.000Z'
const preview = () => createWorkspacePreview(today)
const sampleCourses = createPreviewCourses(today)
const manualCourse: Course = { id: 'manual-course', term: '2026-2', name: '과목', section: '001', days: [], startTime: null, revision: 1 }

test('초기 예시의 과제 ID·현재 값·최신 이력이 일치한다', () => {
  const state = preview()
  for (const candidate of state.candidates) {
    if (candidate.expectedTaskId) assert.ok(state.tasks.some(task => task.id === candidate.expectedTaskId))
    assert.ok(state.notices.some(notice => notice.id === candidate.noticeId))
  }
  for (const task of state.tasks) assert.deepEqual(state.history.find(record => record.taskId === task.id)?.after, historyValues(task))
  for (const task of state.tasks) {
    const course = sampleCourses.find(course => course.id === task.courseId)!
    assert.ok(course)
    assert.deepEqual([task.term, task.course, task.section], [course.term, course.name, course.section])
  }
  const report = state.candidates[0]
  assert.deepEqual(reviewTasks(state.tasks).find(task => task.id === report.expectedTaskId)?.values, report.before)
})

test('검토는 과제·공지·이력·알림을 함께 갱신하고 다른 과제를 보존한다', () => {
  const state = preview()
  const candidate = state.candidates.find(item => item.id === 'report-change')!
  const draft = initialReviewDraft(candidate, reviewTasks(state.tasks))
  const { state: next, result } = applyWorkspaceReview(state, candidate.id, draft, 'unused', now, sampleCourses)
  const task = next.tasks.find(item => item.id === result.targetId)!
  assert.equal(task.dueDate, '2026-12-01')
  assert.equal(task.submissionFormat, 'PDF')
  assert.equal(task.quantity, '5쪽 이내')
  assert.equal(task.status, 'in-progress')
  assert.equal(next.tasks.find(item => item.id === 'preview-algorithm'), state.tasks.find(item => item.id === 'preview-algorithm'))
  assert.equal(next.history.at(-1)?.version, 2)
  assert.deepEqual(next.history.at(-1)?.before, historyValues(state.tasks.find(item => item.id === task.id)!))
  assert.deepEqual(next.history.at(-1)?.after, historyValues(task))
  assert.deepEqual(next.history.at(-1)?.source?.paragraphs, state.notices.find(item => item.id === candidate.noticeId)?.paragraphs)
  assert.equal(next.notifications.at(-1)?.delivery, 'in-app')
  assert.deepEqual(next.notifications.at(-1)?.target, { type: 'task', id: task.id })
  assert.equal(next.notices.find(item => item.id === candidate.noticeId)?.isRead, true)
  assert.deepEqual(state.results, {})
  assert.equal(state.tasks.find(item => item.id === task.id)?.submissionFormat, 'HWP')
})

test('같은 공지의 남은 후보가 모두 완료되어야 반영 완료이며 재실행은 중복을 만들지 않는다', () => {
  const state = preview()
  const candidate = state.candidates[0]
  const first = applyWorkspaceReview(state, candidate.id, initialReviewDraft(candidate, reviewTasks(state.tasks)), 'unused', now, sampleCourses)
  assert.equal(first.state.notices.find(item => item.id === candidate.noticeId)?.status, 'review')
  const duplicate = applyWorkspaceReview(first.state, candidate.id, initialReviewDraft(candidate, []), 'another', now, sampleCourses)
  assert.equal(duplicate.state, first.state)
  const conflict = first.state.candidates.find(item => item.id === 'manual-conflict')!
  const draft = initialReviewDraft(conflict, reviewTasks(first.state.tasks))
  draft.choices.dueDate = 'current'
  const next = applyWorkspaceReview(first.state, conflict.id, draft, 'unused', now, sampleCourses).state
  assert.equal(next.notices.find(item => item.id === candidate.noticeId)?.status, 'applied')
})

test('검토 도중 직접 수정한 값을 덮어쓰거나 일부 상태만 반영하지 않는다', () => {
  const store = createWorkspaceStore(preview())
  const candidate = store.getSnapshot().candidates[0]
  const draft = initialReviewDraft(candidate, reviewTasks(store.getSnapshot().tasks))
  const task = store.getSnapshot().tasks.find(item => item.id === candidate.expectedTaskId)!
  store.saveTask({ ...taskDraft(task), dueDate: '2026-12-05' }, task.id, now, [])
  const changed = store.getSnapshot()
  assert.throws(() => store.applyReview(candidate.id, draft, 'unused', now, sampleCourses))
  assert.equal(store.getSnapshot(), changed)
  assert.deepEqual(changed.results, {})
})

test('현재 값 유지도 검토 이력을 기록하고 새 과제 등록은 한 번만 수행한다', () => {
  let state = preview()
  const candidate = state.candidates[0]
  const draft = initialReviewDraft(candidate, reviewTasks(state.tasks))
  for (const field of Object.keys(draft.choices) as (keyof typeof draft.choices)[]) draft.choices[field] = 'current'
  const kept = applyWorkspaceReview(state, candidate.id, draft, 'unused', now, sampleCourses)
  assert.deepEqual(kept.result.changedFields, [])
  assert.deepEqual(kept.state.history.at(-1)?.before, kept.state.history.at(-1)?.after)
  state = kept.state
  const fresh = state.candidates.find(item => item.id === 'target-check')!
  const newDraft = initialReviewDraft(fresh, reviewTasks(state.tasks), 'new')
  newDraft.targetConfirmed = true
  const added = applyWorkspaceReview(state, fresh.id, newDraft, 'new-task', now, sampleCourses)
  assert.equal(added.result.targetId, 'new-task')
  assert.equal(added.state.tasks.length, state.tasks.length + 1)
  assert.equal(added.state.tasks.at(-1)?.source, 'example')
  assert.equal(added.state.tasks.at(-1)?.courseId, sampleCourses.find(course => course.name === fresh.course)?.id)
  assert.equal(added.state.history.at(-1)?.kind, 'created')
  assert.equal(added.state.notices.find(item => item.id === fresh.noticeId)?.status, 'applied')
  assert.equal(applyWorkspaceReview(added.state, fresh.id, newDraft, 'new-task-2', now, sampleCourses).state, added.state)
})

test('과목명만 입력하거나 연결을 해제하거나 없는 과목에 새 과제를 등록할 수 없다', () => {
  const initial = preview()
  const store = createWorkspaceStore(initial)
  const draft = { ...emptyTaskDraft(), title: '새 과제', course: manualCourse.name }
  assert.throws(() => store.saveTask(draft, 'new', now, [manualCourse]))
  assert.throws(() => store.saveTask({ ...draft, courseId: 'missing' }, 'new', now, [manualCourse]))
  const existing = initial.tasks[0]
  assert.throws(() => store.saveTask({ ...taskDraft(existing), courseId: '' }, existing.id, now, sampleCourses))
  assert.throws(() => store.saveTask({ ...taskDraft(existing) }, 'new', now, []))
  assert.equal(store.getSnapshot(), initial)
  const kept = store.saveTask({ ...taskDraft(existing), course: '조작', section: '999', term: '2025-1', status: 'written' }, existing.id, now, [])
  assert.deepEqual([kept.courseId, kept.course, kept.section, kept.term], [existing.courseId, existing.course, existing.section, existing.term])
  const moved = store.saveTask({ ...taskDraft(kept), courseId: manualCourse.id }, kept.id, now, [manualCourse])
  assert.deepEqual([moved.courseId, moved.course, moved.section, moved.term], [manualCourse.id, manualCourse.name, manualCourse.section, manualCourse.term])
})

test('공지 검토로 새 과제를 만들 때도 등록한 동일 학기·과목·분반이 필요하며 실패 시 상태를 보존한다', () => {
  const initial = preview()
  const candidate = initial.candidates.find(candidate => candidate.allowNew)!
  const draft = { ...initialReviewDraft(candidate, reviewTasks(initial.tasks), 'new'), targetConfirmed: true }
  const store = createWorkspaceStore(initial)
  assert.throws(() => store.applyReview(candidate.id, draft, 'new', now, []))
  assert.throws(() => store.applyReview(candidate.id, draft, 'new', now, sampleCourses.map(course => ({ ...course, term: '2025-1' }))))
  assert.equal(store.getSnapshot(), initial)
  const manual = { ...initial.tasks.find(task => task.course === candidate.course)!, id: 'manual-target', source: 'manual' as const }
  const mixed = { ...initial, tasks: [...initial.tasks, manual] }
  const wrongTarget = initialReviewDraft(candidate, reviewTasks(mixed.tasks), manual.id)
  wrongTarget.targetConfirmed = true
  assert.throws(() => applyWorkspaceReview(mixed, candidate.id, wrongTarget, 'new', now, sampleCourses))
})

test('과제 등록·메모·상태 변경을 기록하며 값이 같은 저장은 중복 이력을 만들지 않는다', () => {
  const original = preview()
  const created = saveWorkspaceTask(original, { ...emptyTaskDraft(), courseId: manualCourse.id, title: '직접 과제', course: '과목' }, 'manual', now, [manualCourse])
  assert.equal(created.state.history.at(-1)?.version, 1)
  const edited = saveWorkspaceTask(created.state, { ...taskDraft(created.result), description: '<script>그대로 보관</script>', status: 'written' }, 'manual', now, [manualCourse])
  assert.equal(edited.state.history.at(-1)?.version, 2)
  assert.equal(edited.state.history.at(-1)?.after.description, '<script>그대로 보관</script>')
  assert.equal(saveWorkspaceTask(edited.state, taskDraft(edited.result), 'manual', now, [manualCourse]).state, edited.state)
})

test('과목은 ID로 연결하고 이름 변경·과목 삭제 후에도 과제를 보존한다', () => {
  const course: Course = { id: 'course-one', term: '2026-2', name: '연결 과목', section: '002', days: [], startTime: null, revision: 1 }
  const initial = preview()
  const created = saveWorkspaceTask(initial, { ...emptyTaskDraft(), courseId: course.id, course: '조작 이름', section: '999', title: '연결 과제' }, 'linked', now, [course])
  assert.equal(created.result.course, course.name)
  assert.equal(created.result.section, '002')
  assert.equal(created.result.term, course.term)
  const resolved = resolveTaskCourses(created.state.tasks, [{ ...course, name: '변경한 과목', revision: 2 }])
  assert.equal(resolved.find(task => task.id === 'linked')?.course, '변경한 과목')
  assert.equal(resolveTaskCourses(created.state.tasks, []).find(task => task.id === 'linked')?.course, '연결 과목')
  assert.equal(saveWorkspaceTask(created.state, { ...taskDraft(created.result), status: 'submitted' }, 'linked', now, []).result.status, 'submitted')
  assert.throws(() => saveWorkspaceTask(initial, { ...emptyTaskDraft(), courseId: 'missing', course: '과목', title: '실패' }, 'bad', now, []))
})

test('새 과제와 공지·검토 완료 알림은 소속 학기를 보존하며 다른 학기 기록을 유지한다', () => {
  const initial = preview()
  const summerCourse = { ...manualCourse, term: '2026-summer', name: '여름 과목' }
  const created = saveWorkspaceTask(initial, { ...emptyTaskDraft('2026-summer'), courseId: summerCourse.id, course: '여름 과목', title: '계절학기 과제' }, 'summer-task', now, [summerCourse])
  assert.equal(created.result.term, '2026-summer')
  assert.equal(created.state.tasks.filter(task => task.term === '2026-2').length, initial.tasks.length)
  const candidate = initial.candidates[0]
  const applied = applyWorkspaceReview(initial, candidate.id, initialReviewDraft(candidate, reviewTasks(initial.tasks)), 'unused', now, sampleCourses)
  assert.equal(applied.state.notifications.at(-1)?.term, candidate.term)
  const store = createWorkspaceStore(created.state)
  store.addNotice({ term: '2026-summer', title: '여름 공지', course: '여름 과목', body: '원문' }, 'summer-notice', new Date(now))
  assert.equal(store.getSnapshot().notices[0].term, '2026-summer')
})

test('구독자는 통합된 결과만 보고 공지·알림 읽음과 직접 입력은 같은 탭 상태에 남는다', () => {
  const store = createWorkspaceStore(preview())
  let calls = 0
  const unsubscribe = store.subscribe(() => { calls += 1; assert.equal(store.getSnapshot().history.at(-1)?.version, 2) })
  const candidate = store.getSnapshot().candidates[0]
  store.applyReview(candidate.id, initialReviewDraft(candidate, reviewTasks(store.getSnapshot().tasks)), 'unused', now, sampleCourses)
  assert.equal(calls, 1)
  unsubscribe()
  store.addNotice({ title: '직접 공지', course: '과목', body: '원문' }, 'manual-notice', new Date(now))
  store.setNoticeRead('manual-notice', false)
  assert.equal(store.getSnapshot().notices[0].isRead, false)
  assert.equal(store.getSnapshot().notices[0].status, 'unreviewed')
  const failure = store.getSnapshot().notifications.find(item => item.delivery === 'failed')!
  store.markNotificationsRead([failure.id])
  assert.equal(store.getSnapshot().notifications.find(item => item.id === failure.id)?.failureReason, failure.failureReason)
  assert.equal(store.getSnapshot().notifications.find(item => item.id === failure.id)?.isRead, true)
})
