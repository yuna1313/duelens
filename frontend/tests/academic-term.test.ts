import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isTerm, termLabel, termOptions } from '../src/domain/academicTerm.ts'

test('정규·계절학기를 구분하고 다른 연도와 기존 학기를 선택 목록에 보존한다', () => {
  for (const term of ['2026-1', '2026-2', '2026-summer', '2026-winter']) assert.equal(isTerm(term), true)
  for (const term of ['2026-3', '2026-autumn', '026-1', '2026-2-extra', '0000-1']) assert.equal(isTerm(term), false)
  assert.equal(termLabel('2026-summer'), '2026년 여름 계절학기')
  assert.equal(termLabel('2027-winter'), '2027년 겨울 계절학기')
  const options = termOptions('2026-2', ['2020-1', '2026-2', '잘못된 값'])
  assert.deepEqual(options.filter(value => value.startsWith('2026-')), ['2026-winter', '2026-2', '2026-summer', '2026-1'])
  assert.ok(options.includes('2020-1'))
  assert.equal(options.length, new Set(options).size)
})
