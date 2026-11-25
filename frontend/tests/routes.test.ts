import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRoute } from '../src/app/routes.ts'

test('시작·목록·관리 화면의 기존 주소와 마지막 슬래시를 유지한다', () => {
  for (const hash of ['', '#/', '#/start', '#/start/']) assert.equal(parseRoute(hash).page, 'start')
  for (const page of ['courses', 'connection', 'notifications', 'tasks', 'notices', 'reviews']) {
    assert.equal(parseRoute(`#/${page}`).page, page)
    assert.equal(parseRoute(`#/${page}/`).page, page)
  }
})

test('직접 진입한 과제 상세·수정·이력과 공지·검토 ID를 구분한다', () => {
  for (const [suffix, mode] of [['', 'detail'], ['/edit', 'edit'], ['/history', 'history']]) {
    const route = parseRoute(`#/tasks/preview-report${suffix}`)
    assert.equal(route.page, 'tasks')
    if (route.page === 'tasks') { assert.equal(route.mode, mode); assert.equal(route.taskId, 'preview-report') }
  }
  const create = parseRoute('#/tasks/new')
  assert.ok(create.page === 'tasks' && create.mode === 'create' && create.taskId === null)
  assert.deepEqual(parseRoute('#/notices/manual-123'), { page: 'notices', title: '공지 원문', noticeId: 'manual-123' })
  assert.deepEqual(parseRoute('#/reviews/date-check'), { page: 'reviews', title: '변경 검토', reviewId: 'date-check' })
})

test('과제에서 과목을 먼저 등록하는 경로를 구분한다', () => {
  assert.deepEqual(parseRoute('#/courses/new/task'), { page: 'courses', title: '과목·수업', adding: true, creatingTask: true })
  assert.deepEqual(parseRoute('#/courses/new'), { page: 'courses', title: '과목·수업', adding: true, creatingTask: false })
  assert.equal(parseRoute('#/courses/new/invalid').page, 'not-found')
})

test('알 수 없는 메뉴·설정 하위 주소·중첩 경로·손상된 ID를 다른 화면으로 대체하지 않는다', () => {
  for (const hash of ['#/does-not-exist', '#/settings/does-not-exist', '#/tasks/new/edit', '#/tasks/id/edit/extra', '#/notices/id/extra', '#/reviews/%ZZ', '#/tasks//edit', '#main']) assert.equal(parseRoute(hash).page, 'not-found', hash)
  const data = parseRoute('#/settings/data')
  assert.ok(data.page === 'settings' && data.tab === 'data')
  const privacy = parseRoute('#/settings/privacy')
  assert.ok(privacy.page === 'settings' && privacy.tab === 'privacy')
})
