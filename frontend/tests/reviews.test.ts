import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyReview, initialReviewDraft, validateReview } from '../src/features/reviews/model.ts'
import type { ReviewCandidate, ReviewTask } from '../src/features/reviews/model.ts'

const values = { dueDate: '2026-11-27', dueTime: '18:00', submissionFormat: 'HWP', quantity: '5쪽' }
const task: ReviewTask = { id: 'report', title: '보고서', course: '과목', section: '001', values: { ...values } }
const candidate: ReviewCandidate = {
  id: 'review', noticeId: 'notice', title: '보고서', course: '과목', section: '001', label: '변경', description: '',
  expectedTaskId: 'report', allowNew: false, needsDate: false, before: { ...values },
  proposal: { dueDate: '2026-11-30', submissionFormat: 'PDF' }, evidence: '원문',
}

test('선택한 변경만 적용하며 원본과 공지에 없는 값은 유지한다', () => {
  const draft = initialReviewDraft(candidate, [task])
  draft.choices.submissionFormat = 'current'
  const result = applyReview(candidate, [task], draft)
  assert.equal(result.values.dueDate, '2026-11-30')
  assert.equal(result.values.submissionFormat, 'HWP')
  assert.equal(result.values.quantity, '5쪽')
  assert.equal(task.values.dueDate, '2026-11-27')
  assert.deepEqual(result.changedFields, ['dueDate'])
})

test('직접 수정값과 충돌하면 자동 덮어쓰기를 막고 명시적 유지 선택을 허용한다', () => {
  const edited = { ...task, values: { ...values, dueDate: '2026-11-29' } }
  const draft = initialReviewDraft(candidate, [edited])
  assert.ok(validateReview(candidate, [edited], draft).choices)
  assert.throws(() => applyReview(candidate, [edited], draft))
  draft.choices.dueDate = 'current'
  assert.equal(applyReview(candidate, [edited], draft).values.dueDate, '2026-11-29')
  draft.choices.submissionFormat = 'current'
  assert.deepEqual(applyReview(candidate, [edited], draft).changedFields, [])
})

test('마감 날짜를 직접 확인하고 시각 미정을 명시하기 전에는 완료할 수 없다', () => {
  const unresolved = { ...candidate, needsDate: true, proposal: { dueDate: null, dueTime: null } }
  const draft = initialReviewDraft(unresolved, [task])
  assert.ok(validateReview(unresolved, [task], draft).dueDate)
  draft.manualDate = '2026-04-31'
  assert.ok(validateReview(unresolved, [task], draft).dueDate)
  draft.manualDate = '2026-11-30'
  draft.dateConfirmed = true
  assert.ok(validateReview(unresolved, [task], draft).dueTime)
  draft.timeUnknown = true
  assert.equal(applyReview(unresolved, [task], draft).values.dueTime, null)
})

test('연결 대상·분반·확인 여부를 검증하고 허용된 경우만 새 과제 결과를 만든다', () => {
  const linking = { ...candidate, expectedTaskId: null, allowNew: true }
  const other = { ...task, id: 'other', section: '002' }
  const draft = initialReviewDraft(linking, [task, other])
  assert.ok(validateReview(linking, [task, other], draft).target)
  draft.targetId = 'other'
  draft.targetConfirmed = true
  assert.ok(validateReview(linking, [task, other], draft).target)
  draft.targetId = 'report'
  draft.targetConfirmed = false
  assert.ok(validateReview(linking, [task, other], draft).targetConfirmed)
  draft.targetId = 'new'
  draft.targetConfirmed = true
  assert.equal(applyReview(linking, [task, other], draft).isNew, true)
  assert.ok(validateReview(candidate, [task], draft).target)
})

test('검토 시작 후 바뀐 과제는 기존 선택으로 덮어쓰지 않는다', () => {
  const draft = initialReviewDraft(candidate, [task])
  const changed = { ...task, values: { ...values, dueDate: '2026-11-29' } }
  assert.ok(validateReview(candidate, [changed], draft).stale)
  assert.throws(() => applyReview(candidate, [changed], draft))
})

test('과목과 분반이 같아도 다른 학기의 과제에는 공지 변경을 적용하지 않는다', () => {
  const seasonal = { ...candidate, term: '2026-summer' }
  const otherTerm = { ...task, term: '2026-2' }
  assert.ok(validateReview(seasonal, [otherTerm], initialReviewDraft(seasonal, [otherTerm])).target)
  const sameTerm = { ...task, term: '2026-summer' }
  assert.equal(applyReview(seasonal, [sameTerm], initialReviewDraft(seasonal, [sameTerm])).term, '2026-summer')
})
