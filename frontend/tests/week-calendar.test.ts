import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adjacentMonth, monthCalendar } from '../src/features/tasks/weekCalendar.ts'

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
