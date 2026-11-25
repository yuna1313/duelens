import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adjacentMonth, monthCalendar, scheduleReferenceDate, scheduleTasks } from '../src/features/tasks/weekCalendar.ts'
import { emptyTaskDraft, upsertTask } from '../src/features/tasks/model.ts'
import type { TaskStatus } from '../src/features/tasks/model.ts'

const task = (id: string, dueDate: string, status: TaskStatus = 'todo', dueTime = '') =>
  upsertTask([], { ...emptyTaskDraft('2026-2'), courseId: 'registered-course', course: '과목', title: id, dueDate, dueTime, status }, id).task

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

test('다른 학기의 빈 일정은 오늘 대신 해당 학기 시작 월을 보여주고 겨울 학기의 연도 경계를 구분한다', () => {
  assert.equal(scheduleReferenceDate('2026-1', '2026-11-24', []), '2026-03-02')
  assert.equal(scheduleReferenceDate('2027-summer', '2026-11-24', []), '2027-06-07')
  assert.equal(scheduleReferenceDate('2025-2', '2026-11-24', []), '2025-09-01')
  assert.equal(scheduleReferenceDate('2026-winter', '2026-11-24', []), '2026-12-07')
  assert.equal(scheduleReferenceDate('2026-winter', '2027-01-03', []), '2027-01-03')
  assert.equal(scheduleReferenceDate('2026-2', '2026-11-24', []), '2026-11-24')
})

test('지난 학기는 실제 미제출 마감일을 우선 표시하며 학기 밖 날짜도 숨기거나 다른 학기로 옮기지 않는다', () => {
  const tasks = [
    { ...task('이른마감', '2026-04-03'), term: '2026-1' },
    { ...task('마지막미제출', '2026-06-12'), term: '2026-1' },
    { ...task('제출완료', '2026-07-01', 'submitted'), term: '2026-1' },
    task('다른학기', '2026-11-30'),
  ]
  assert.equal(scheduleReferenceDate('2026-1', '2026-11-24', tasks), '2026-06-12')
  assert.equal(scheduleReferenceDate('2026-1', '2026-11-24', [tasks[2]]), '2026-07-01')
  const outsideMonth = { ...task('학기밖마감', '2026-12-01'), term: '2026-1' }
  assert.equal(scheduleReferenceDate('2026-1', '2026-11-24', [...tasks, outsideMonth]), '2026-12-01')
  assert.deepEqual(scheduleTasks([outsideMonth], '2026-12-01'), [outsideMonth])
})
