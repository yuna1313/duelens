import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyTaskDraft, safeSubmissionUrl, taskDraft, upsertTask, validateTaskDraft } from '../src/features/tasks/model.ts'
import type { TaskDraft } from '../src/features/tasks/model.ts'
import { changeDeadlineMode } from '../src/features/tasks/deadline.ts'

const draft = (changes: Partial<TaskDraft> = {}): TaskDraft => ({ ...emptyTaskDraft(), courseId: 'registered-course', title: '보고서', course: '프로그래밍 기초', ...changes })

test('날짜·시각 미정을 구분하고 잘못된 날짜와 시각만 있는 입력을 거부한다', () => {
  assert.equal(upsertTask([], draft(), 'first').task.dueDate, null)
  assert.equal(upsertTask([], draft({ dueDate: '2028-02-29' }), 'first').task.dueTime, null)
  for (const dueDate of ['2027-02-29', '2026-04-31', '2026-13-01']) assert.ok(validateTaskDraft(draft({ dueDate })).dueDate)
  assert.ok(validateTaskDraft(draft({ dueTime: '10:00' })).dueDate)
  assert.ok(validateTaskDraft(draft({ dueDate: '2026-11-23', dueTime: '24:00' })).dueTime)
  assert.equal(upsertTask([], draft({ dueDate: '2026-11-23', dueTime: '00:00' }), 'first').task.dueTime, '00:00')
})

test('과제 수정은 ID와 출처를 유지하고 원본을 바꾸지 않으며 편집 필드를 복원한다', () => {
  const first = upsertTask([], draft({ submissionFormat: 'PDF', quantity: '5쪽', description: '<b>메모</b>' }), 'first')
  const next = upsertTask(first.tasks, { ...taskDraft(first.task), title: '수정한 보고서', status: 'written' }, 'first')
  assert.equal(next.tasks.length, 1)
  assert.equal(next.task.id, first.task.id)
  assert.equal(next.task.source, 'manual')
  assert.equal(next.task.description, '<b>메모</b>')
  assert.equal(first.task.title, '보고서')
  const example = { ...first.task, source: 'example' as const }
  assert.equal(upsertTask([example], taskDraft(example), example.id).task.source, 'example')
})

test('제출 링크는 웹 주소만 허용하고 실행 스킴과 계정 정보가 든 주소를 거부한다', () => {
  assert.equal(safeSubmissionUrl(' https://example.com/task?id=1 '), 'https://example.com/task?id=1')
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', '/relative', 'https://user:password@example.com', 'https://example.com\n']) {
    assert.equal(safeSubmissionUrl(value), null)
    assert.ok(validateTaskDraft(draft({ submissionUrl: value })).submissionUrl)
  }
})

test('필수 값과 입력 크기를 검사하고 같은 이름의 다른 과제를 별도 ID로 등록한다', () => {
  const errors = validateTaskDraft({ ...emptyTaskDraft(), section: '', description: 'a'.repeat(20_001) })
  assert.ok(errors.courseId && errors.title && errors.course && errors.section && errors.description)
  const first = upsertTask([], draft(), 'first')
  assert.equal(upsertTask(first.tasks, draft(), 'second').tasks.length, 2)
})

test('마감 미정을 켰다가 끄면 수정 중이던 날짜와 시각을 복원하고 원본을 보존한다', () => {
  const original = draft({ dueDate: '2026-11-24', dueTime: '23:59' })
  const unknown = changeDeadlineMode(original, true, { dueDate: '', dueTime: '' })
  assert.equal(unknown.draft.dueDate, '')
  assert.equal(unknown.draft.dueTime, '')
  const restored = changeDeadlineMode(unknown.draft, false, unknown.remembered)
  assert.deepEqual(restored.draft, original)
  const edited = { ...restored.draft, dueDate: '2026-12-01', dueTime: '' }
  const again = changeDeadlineMode(edited, true, restored.remembered)
  assert.deepEqual(changeDeadlineMode(again.draft, false, again.remembered).draft, edited)
  assert.equal(original.dueDate, '2026-11-24')
})

test('마감 미정인 새 과제에 날짜를 임의로 넣지 않는다', () => {
  const empty = draft()
  assert.deepEqual(changeDeadlineMode(empty, false, { dueDate: '', dueTime: '' }).draft, empty)
})
