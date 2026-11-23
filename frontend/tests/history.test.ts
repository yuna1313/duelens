import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterHistory, historyChanges, historyTimestamp, historyValue } from '../src/features/history/model.ts'
import type { HistoryRecord, HistoryValues } from '../src/features/history/model.ts'

const values: HistoryValues = { dueDate: '2026-11-27', dueTime: '18:00', submissionFormat: 'HWP', quantity: '5쪽 이내', progress: '진행 중' }
const record: HistoryRecord = {
  id: 'v2', taskId: 'report', version: 2, occurredAt: '2026-11-23T12:00:00+09:00', kind: 'notice-applied',
  before: { ...values }, after: { ...values, dueDate: '2026-11-30', submissionFormat: 'PDF' }, note: '', source: null,
}

test('변경한 항목만 비교하며 시각 미정과 최초 등록을 구분한다', () => {
  assert.deepEqual(historyChanges(record), ['dueDate', 'submissionFormat'])
  const unknownTime = { ...record, after: { ...values, dueTime: null } }
  assert.deepEqual(historyChanges(unknownTime), ['dueTime'])
  assert.equal(historyValue('dueTime', unknownTime.after.dueTime), '시각 미정')
  assert.equal(historyValue('dueDate', null), '날짜 미정')
  assert.equal(historyValue('quantity', ''), '미정')
  assert.deepEqual(historyChanges({ ...record, after: { ...values } }), [])
  assert.deepEqual(historyChanges({ ...record, before: null }), ['dueDate', 'dueTime', 'submissionFormat', 'quantity', 'progress'])
})

test('과제와 변경 유형을 함께 필터하고 실제 시각의 최신순으로 정렬한다', () => {
  const earlier: HistoryRecord = { ...record, id: 'v1', version: 1, kind: 'created', occurredAt: '2026-11-23T02:30:00Z' }
  const later: HistoryRecord = { ...record, id: 'v3', version: 3, kind: 'manual-edit', occurredAt: '2026-11-23T03:20:00Z' }
  const other: HistoryRecord = { ...record, id: 'other', taskId: 'other' }
  const input = [earlier, record, later, other]
  assert.deepEqual(filterHistory(input, 'report', 'all').map(item => item.id), ['v3', 'v2', 'v1'])
  assert.deepEqual(filterHistory(input, 'report', 'notice-applied').map(item => item.id), ['v2'])
  assert.deepEqual(filterHistory(input, 'missing', 'all'), [])
  assert.deepEqual(input.map(item => item.id), ['v1', 'v2', 'v3', 'other'])
})

test('원문 링크가 만료되어도 기록 당시의 값과 근거 원문을 보존한다', () => {
  const expired: HistoryRecord = {
    ...record, source: {
      noticeId: null, title: '지난 공지', capturedAt: '2026-11-23T11:42:00+09:00', availability: 'expired',
      evidence: '<script>실행하지 않는 원문</script>', paragraphs: ['기록 당시 원문', '제출 조건'],
    },
  }
  const snapshot = structuredClone(expired)
  const result = filterHistory([expired], 'report', 'all')[0]
  historyChanges(result)
  assert.deepEqual(expired, snapshot)
  assert.equal(result.source?.evidence, '<script>실행하지 않는 원문</script>')
  assert.deepEqual(result.source?.paragraphs, ['기록 당시 원문', '제출 조건'])
  assert.match(historyTimestamp('2026-11-23T15:05:00Z'), /2026.*11.*24.*00:05/)
})
