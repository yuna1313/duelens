import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planReminders } from '../src/app/reminderPlan.ts'
import { defaultReminderPreferences } from '../src/features/settings/model.ts'
import { createPreviewTasks } from '../src/mocks/tasks.ts'

const task = { ...createPreviewTasks('2026-11-24')[0], dueDate: '2026-12-01', dueTime: '01:00' }
const now = Date.parse('2026-11-24T00:00:00+09:00')

test('한국 자정·월 경계를 넘어 하루 전·3시간 전을 계산하고 과거 시각을 제외한다', () => {
  const plan = planReminders([task], defaultReminderPreferences(), now)
  assert.equal(plan.length, 2)
  assert.equal(plan[0].scheduledAt, '2026-11-29T16:00:00.000Z')
  assert.equal(plan[1].scheduledAt, '2026-11-30T13:00:00.000Z')
  assert.equal(planReminders([task], defaultReminderPreferences(), Date.parse(plan[0].scheduledAt)).length, 1)
})

test('제출 완료·마감 미정·미지원 날짜에는 예정이 없고 작성 완료 옵션을 따른다', () => {
  for (const value of [{ ...task, status: 'submitted' as const }, { ...task, dueDate: null }, { ...task, dueTime: null }, { ...task, dueDate: '2026-02-30' }]) assert.deepEqual(planReminders([value], defaultReminderPreferences(), now), [])
  const written = { ...task, status: 'written' as const }
  assert.equal(planReminders([written], defaultReminderPreferences(), now).length, 2)
  assert.deepEqual(planReminders([written], { ...defaultReminderPreferences(), afterWritten: false }, now), [])
})

test('마감·개별 옵션이 바뀌면 이전 예정 대신 새 값을 계산한다', () => {
  const preferences = { ...defaultReminderPreferences(), dayBefore: false }
  const changed = { ...task, dueDate: '2026-12-02', dueTime: '12:00' }
  const plan = planReminders([changed], preferences, now)
  assert.equal(plan.length, 1)
  assert.equal(plan[0].reason, 'three-hours-before')
  assert.equal(plan[0].scheduledAt, '2026-12-02T00:00:00.000Z')
  assert.deepEqual(planReminders([task], { ...preferences, threeHoursBefore: false }, now), [])
})
