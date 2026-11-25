import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterTasks, taskGroup } from '../src/features/tasks/model.ts'
import { currentWeek, offsetDate, seoulDateKey } from '../src/utils/date.ts'
import type { TaskPreview } from '../src/features/tasks/model.ts'

const task: TaskPreview = {
  courseId: 'example-course',
  id: 'preview', title: '중간보고서', course: '프로그래밍 기초', section: '001', tone: 'green',
  dueDate: '2026-11-23', dueTime: null, status: 'written', description: '',
  source: 'example', submissionFormat: '', quantity: '', submissionUrl: '',
}

test('한국 자정과 연말을 기준으로 오늘과 날짜 이동을 계산한다', () => {
  assert.equal(seoulDateKey(new Date('2026-11-22T15:00:00Z')), '2026-11-23')
  assert.equal(offsetDate('2026-12-31', 1), '2027-01-01')
  assert.equal(currentWeek('2027-01-03')[0], '2026-12-28')
  assert.equal(currentWeek('2027-01-04')[0], '2027-01-04')
})

test('제출 완료·마감 미정·작성 완료를 날짜와 함께 구분한다', () => {
  assert.equal(taskGroup(task, '2026-11-23'), 'today')
  assert.equal(taskGroup(task, '2026-11-24'), 'overdue')
  assert.equal(taskGroup({ ...task, dueDate: null }, '2026-11-23'), 'unknown')
  assert.equal(taskGroup({ ...task, status: 'submitted' }, '2026-11-24'), 'submitted')
})

test('검색·과목·상태 필터를 동시에 적용하며 원본 목록을 바꾸지 않는다', () => {
  const items = [task, { ...task, id: 'other', section: '002', status: 'todo' as const }]
  assert.deepEqual(filterTasks(items, ' 001 ', '프로그래밍 기초', 'written'), [task])
  assert.equal(filterTasks(items, '없는 과제', 'all', 'all').length, 0)
  assert.equal(items[0], task)
  assert.equal(task.dueTime, null)
})
