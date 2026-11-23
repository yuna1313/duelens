import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyCollectionResults, connectionTotals, disconnectPreview, previewScenario, reconnectPreview } from '../src/features/connection/model.ts'
import type { CollectedCourse, ConnectionPreview } from '../src/features/connection/model.ts'

const previousAt = '2026-11-22T16:20:00+09:00'
const attemptedAt = '2026-11-23T11:42:00+09:00'
const course: CollectedCourse = { id: 'one', name: '과목', section: '001', tone: 'green', status: 'updated', lastSuccessAt: previousAt, lastAttemptAt: previousAt, taskCount: 2, noticeCount: 3, reviewCount: 1, error: null }
const preview: ConnectionPreview = { state: 'connected', courses: [course, { ...course, id: 'two' }], lastAttemptAt: previousAt, lastSuccessAt: previousAt }

test('일부 수집 실패 시 해당 과목의 기존 기록과 마지막 성공 시각을 보존한다', () => {
  const result = applyCollectionResults(preview, [
    { courseId: 'one', ok: true, taskCount: 3, noticeCount: 4, reviewCount: 2 },
    { courseId: 'two', ok: false, reason: '응답 시간 초과' },
  ], attemptedAt)
  assert.equal(previewScenario(result), 'partial')
  assert.equal(result.courses[0].lastSuccessAt, attemptedAt)
  assert.equal(result.courses[1].lastSuccessAt, previousAt)
  assert.equal(result.courses[1].lastAttemptAt, attemptedAt)
  assert.equal(result.courses[1].taskCount, 2)
  assert.equal(result.courses[1].noticeCount, 3)
  assert.equal(result.courses[1].error, '응답 시간 초과')
  assert.deepEqual(connectionTotals(result.courses), { tasks: 5, notices: 7, reviews: 3 })
  assert.equal(preview.courses[0].taskCount, 2)
  assert.equal(preview.courses[1].status, 'updated')
})

test('선택한 과목만 재시도하고 전체 실패일 때 마지막 성공을 갱신하지 않는다', () => {
  const failed = applyCollectionResults(preview, [{ courseId: 'one', ok: false, reason: '수집 실패' }], attemptedAt)
  assert.equal(failed.lastSuccessAt, previousAt)
  assert.equal(failed.courses[1], preview.courses[1])
  const retried = applyCollectionResults(failed, [{ courseId: 'one', ok: true, taskCount: 2, noticeCount: 3, reviewCount: 1 }], attemptedAt)
  assert.equal(retried.courses[0].status, 'updated')
  assert.equal(retried.courses[0].error, null)
  assert.equal(retried.courses[1], preview.courses[1])
})

test('해제·만료 상태의 수집을 막고 재연결만으로 기존 수집을 성공 처리하지 않는다', () => {
  const disconnected = disconnectPreview(preview)
  assert.equal(disconnected.state, 'disconnected')
  assert.equal(disconnected.courses[0].status, 'paused')
  assert.deepEqual(connectionTotals(disconnected.courses), connectionTotals(preview.courses))
  assert.equal(disconnected.lastSuccessAt, previousAt)
  assert.throws(() => applyCollectionResults(disconnected, [], attemptedAt))
  assert.throws(() => applyCollectionResults({ ...preview, state: 'expired' }, [], attemptedAt))
  const connected = reconnectPreview({ ...preview, state: 'expired' })
  assert.equal(connected.courses[0].status, 'waiting')
  assert.equal(connected.courses[0].lastSuccessAt, previousAt)
  assert.equal(connected.lastSuccessAt, previousAt)
})

test('알 수 없는 과목·중복 결과·잘못된 기록 수를 거부한다', () => {
  const success = { courseId: 'one', ok: true as const, taskCount: 1, noticeCount: 2, reviewCount: 1 }
  assert.throws(() => applyCollectionResults(preview, [{ ...success, courseId: 'missing' }], attemptedAt))
  assert.throws(() => applyCollectionResults(preview, [success, success], attemptedAt))
  assert.throws(() => applyCollectionResults(preview, [{ ...success, taskCount: -1 }], attemptedAt))
  assert.throws(() => applyCollectionResults(preview, [{ ...success, reviewCount: 3 }], attemptedAt))
})
