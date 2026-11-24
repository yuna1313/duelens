import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterTaskPeriod, taskPeriodRange, taskSummary } from '../src/features/tasks/period.ts'
import { emptyTaskDraft, upsertTask } from '../src/features/tasks/model.ts'
import type { TaskStatus } from '../src/features/tasks/model.ts'

const task = (id: string, dueDate: string, status: TaskStatus = 'todo') =>
  upsertTask([], { ...emptyTaskDraft('2026-2'), course: '과목', title: id, dueDate, status }, id).task

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

test('달력으로 선택한 주의 연말 범위로 목록·집계를 조회하고 이번 주 복귀는 오늘을 따른다', () => {
  const today = '2026-11-24'
  const selected = '2027-01-01'
  assert.deepEqual(taskPeriodRange('selected-week', today, selected), { start: '2026-12-28', end: '2027-01-03' })
  assert.deepEqual(taskPeriodRange('week', today, selected), { start: '2026-11-23', end: '2026-11-29' })
  const tasks = [task('이전주', '2026-12-27'), task('월', '2026-12-28'), task('일제출', '2027-01-03', 'submitted'), task('다음주', '2027-01-04'), task('미정', '')]
  const result = filterTaskPeriod(tasks, 'selected-week', today, selected)
  assert.deepEqual(result.map(item => item.id), ['월', '일제출'])
  assert.deepEqual(taskSummary(result), { total: 2, remaining: 1, submitted: 1, unknown: 0 })
})
