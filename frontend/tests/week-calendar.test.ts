import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adjacentMonth, monthCalendar, scheduleTasks } from '../src/features/tasks/weekCalendar.ts'
import { emptyTaskDraft, upsertTask } from '../src/features/tasks/model.ts'
import type { TaskStatus } from '../src/features/tasks/model.ts'

const task = (id: string, dueDate: string, status: TaskStatus = 'todo', dueTime = '') =>
  upsertTask([], { ...emptyTaskDraft('2026-2'), course: '과목', title: id, dueDate, dueTime, status }, id).task

test('월 달력은 월요일부터 일요일까지 이어지며 윤년 2월과 앞뒤 달 날짜를 포함한다', () => {
  const leap = monthCalendar('2028-02-15')
  assert.equal(leap[0], '2028-01-31')
  assert.equal(leap.at(-1), '2028-03-05')
  assert.ok(leap.includes('2028-02-29'))
  assert.equal(leap.length % 7, 0)
  assert.equal(new Set(leap).size, leap.length)
  assert.deepEqual(monthCalendar('2027-02-01'), Array.from({ length: 28 }, (_, index) => `2027-02-${String(index + 1).padStart(2, '0')}`))
  const lastMonth = monthCalendar('9999-12-01')
  assert.ok(lastMonth.includes('9999-12-31'))
  assert.equal(lastMonth.length % 7, 0)
  assert.equal(new Set(lastMonth).size, lastMonth.length)
})

test('월 이동은 말일에서 건너뛰지 않고 연도 경계를 지나며 지원 범위를 벗어나지 않는다', () => {
  assert.equal(adjacentMonth('2026-01-31', 1), '2026-02-01')
  assert.equal(adjacentMonth('2026-12-31', 1), '2027-01-01')
  assert.equal(adjacentMonth('2027-01-01', -1), '2026-12-01')
  assert.equal(adjacentMonth('1000-01-01', -1), null)
  assert.equal(adjacentMonth('9999-12-31', 1), null)
})

test('일정은 연도를 넘는 선택 주의 미제출만 표시하며 날짜·시각 순으로 정렬한다', () => {
  const tasks = [task('다음주', '2027-01-04'), task('일제출', '2027-01-03', 'submitted'),
    task('일미제출', '2027-01-03'), task('작성완료', '2026-12-28', 'written', '10:00'),
    task('시각미정', '2026-12-28'), task('이른시각', '2026-12-28', 'todo', '09:00'),
    task('날짜미정', ''), task('전주', '2026-12-27')]
  const original = [...tasks]
  assert.deepEqual(scheduleTasks(tasks, '2027-01-01').map(item => item.id), ['이른시각', '작성완료', '시각미정', '일미제출'])
  assert.deepEqual(tasks, original)
})

test('일정에서 날짜를 선택하면 해당 주의 그날 과제만 표시하고 빈 날짜·다른 주는 비어 있다', () => {
  const tasks = [task('월', '2026-12-28'), task('금', '2027-01-01'), task('다음주', '2027-01-04')]
  assert.deepEqual(scheduleTasks(tasks, '2027-01-01', '2026-12-28').map(item => item.id), ['월'])
  assert.deepEqual(scheduleTasks(tasks, '2027-01-01', '2026-12-29'), [])
  assert.deepEqual(scheduleTasks(tasks, '2027-01-01', '2027-01-04'), [])
})
