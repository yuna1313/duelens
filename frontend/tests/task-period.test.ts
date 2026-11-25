import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterTaskPeriod, taskPeriodRange, taskSummary } from '../src/features/tasks/period.ts'
import { emptyTaskDraft, upsertTask } from '../src/features/tasks/model.ts'
import type { TaskStatus } from '../src/features/tasks/model.ts'

const task = (id: string, dueDate: string, status: TaskStatus = 'todo') =>
  upsertTask([], { ...emptyTaskDraft('2026-2'), courseId: 'registered-course', course: '과목', title: id, dueDate, status }, id).task

test('이번 주는 연도가 바뀌어도 월요일부터 일요일까지 양끝 마감일을 포함한다', () => {
  assert.deepEqual(taskPeriodRange('week', '2027-01-01'), { start: '2026-12-28', end: '2027-01-03' })
  const tasks = [task('전주', '2026-12-27'), task('월', '2026-12-28'), task('일', '2027-01-03'), task('다음주', '2027-01-04'), task('미정', '')]
  assert.deepEqual(filterTaskPeriod(tasks, 'week', '2027-01-01').map(item => item.id), ['월', '일'])
  assert.equal(tasks.length, 5)
})

test('이번 달은 윤년·평년·연말의 실제 말일을 사용하고 제출 완료도 마감일로 조회한다', () => {
  assert.deepEqual(taskPeriodRange('month', '2028-02-15'), { start: '2028-02-01', end: '2028-02-29' })
  assert.deepEqual(taskPeriodRange('month', '2027-02-15'), { start: '2027-02-01', end: '2027-02-28' })
  assert.deepEqual(taskPeriodRange('month', '2026-12-31'), { start: '2026-12-01', end: '2026-12-31' })
  const tasks = [task('이달제출', '2028-02-29', 'submitted'), task('다음달제출', '2028-03-01', 'submitted'), task('미정', '')]
  assert.deepEqual(filterTaskPeriod(tasks, 'month', '2028-02-15').map(item => item.id), ['이달제출'])
  assert.deepEqual(filterTaskPeriod(tasks, 'undated', '2028-02-15').map(item => item.id), ['미정'])
})

test('조회 집계에서 작성 완료와 기한이 지난 미제출은 남은 과제로 계산한다', () => {
  const tasks = [task('기한지남', '2026-10-01'), task('작성완료', '2026-11-24', 'written'), task('제출', '2026-11-24', 'submitted'), task('미정', '')]
  assert.deepEqual(taskSummary(tasks), { total: 4, remaining: 3, submitted: 1, unknown: 1 })
  assert.deepEqual(taskSummary(filterTaskPeriod(tasks, 'week', '2026-11-24')), { total: 2, remaining: 1, submitted: 1, unknown: 0 })
  assert.deepEqual(taskSummary([]), { total: 0, remaining: 0, submitted: 0, unknown: 0 })
})
