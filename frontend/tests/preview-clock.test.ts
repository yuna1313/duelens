import { test } from 'node:test'
import assert from 'node:assert/strict'
import { watchPreviewClock } from '../src/app/previewClock.ts'
import { seoulDateKey } from '../src/utils/date.ts'

test('한국 자정의 분 경계에서 날짜를 갱신하고 해제 후에는 갱신하지 않는다', () => {
  let now = Date.parse('2026-11-24T23:59:59.950+09:00')
  let callback = () => {}
  let delay = 0
  let cancelled = false
  const ticks: number[] = []
  const stop = watchPreviewClock({ now: () => now, schedule: (action, timeout) => { callback = action; delay = timeout; return () => { cancelled = true } } }, value => ticks.push(value))
  assert.equal(delay, 50)
  now += 50; callback()
  assert.equal(seoulDateKey(new Date(ticks[0])), '2026-11-25')
  assert.equal(delay, 60_000)
  stop()
  assert.equal(cancelled, true)
  now += 60_000; callback()
  assert.equal(ticks.length, 1)
})

test('백그라운드에서 늦게 실행된 갱신도 실제 현재 시각으로 보정한다', () => {
  let now = Date.parse('2026-12-31T23:59:20+09:00')
  let callback = () => {}
  let delay = 0
  let displayed = now
  const stop = watchPreviewClock({ now: () => now, schedule: (action, timeout) => { callback = action; delay = timeout; return () => {} } }, value => { displayed = value })
  now += 125_000; callback()
  assert.equal(displayed, now)
  assert.equal(seoulDateKey(new Date(displayed)), '2027-01-01')
  assert.equal(delay, 35_000)
  stop()
})
