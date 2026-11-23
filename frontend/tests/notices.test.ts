import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createManualNotice, filterNotices, needsReview, validateNoticeDraft } from '../src/features/notices/model.ts'
import type { Notice } from '../src/features/notices/model.ts'

const notice: Notice = {
  id: 'example', course: '프로그래밍 기초', title: '중간보고서', excerpt: 'PDF 제출',
  paragraphs: ['보고서를 PDF로 제출해 주세요.'], publishedAt: '2026-11-23T11:30:00+09:00',
  status: 'review', isRead: false, source: 'example',
}

test('공지 본문 검색·과목·검토 상태를 함께 적용하고 최신순으로 정렬한다', () => {
  const newer = { ...notice, id: 'newer', publishedAt: '2026-11-23T12:00:00+09:00' }
  const items = [notice, { ...notice, id: 'applied', status: 'applied' as const }, newer]
  assert.deepEqual(filterNotices(items, ' pdf ', '프로그래밍 기초', 'review').map(item => item.id), ['newer', 'example'])
  assert.equal(filterNotices(items, '', '다른 과목', 'all').length, 0)
  assert.equal(filterNotices(items, '', 'all', 'applied').length, 1)
  assert.equal(items[0], notice)
})

test('분석 전과 날짜 확인은 검토 대상으로 두며 과제 없음·반영 완료는 제외한다', () => {
  for (const status of ['review', 'date-check', 'new-task', 'unreviewed'] as const) assert.ok(needsReview({ ...notice, status }))
  for (const status of ['applied', 'no-task'] as const) assert.equal(needsReview({ ...notice, status }), false)
})

test('직접 입력은 필수 값과 크기를 검증하고 원문을 HTML로 해석하지 않는다', () => {
  const draft = { course: ' 과목 ', title: ' 공지 ', body: '<b>확인</b>\n\n원문 그대로' }
  assert.equal(Object.keys(validateNoticeDraft({ course: '', title: ' ', body: '' })).length, 3)
  assert.ok(validateNoticeDraft({ ...draft, body: 'a'.repeat(20_001) }).body)
  assert.throws(() => createManualNotice({ ...draft, title: '' }, 'id'), /입력/)
  const result = createManualNotice(draft, 'manual-id', new Date('2026-11-23T03:00:00Z'))
  assert.deepEqual(result.paragraphs, ['<b>확인</b>', '원문 그대로'])
  assert.equal(result.source, 'manual')
  assert.equal(result.status, 'unreviewed')
  assert.equal(result.summary, undefined)
})
