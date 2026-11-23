import type { CollectedCourse, CollectionResult, ConnectionPreview, ConnectionScenario } from '@/features/connection/model'
import { offsetDate } from '@/utils/date'

// 학교 인증·수집과 무관한 화면 예시입니다. 사용자가 등록한 과목과 별도로 구성합니다.
export function createConnectionPreview(today: string, scenario: ConnectionScenario): ConnectionPreview {
  if (scenario === 'disconnected') return { state: 'disconnected', courses: [], lastAttemptAt: null, lastSuccessAt: null }
  const attemptedAt = `${today}T11:42:00+09:00`
  const previousAt = `${offsetDate(today, -1)}T16:20:00+09:00`
  const rows: Omit<CollectedCourse, 'status' | 'lastSuccessAt' | 'lastAttemptAt' | 'error'>[] = [
    { id: 'collection-programming', name: '프로그래밍 기초', section: '001', tone: 'green', taskCount: 1, noticeCount: 2, reviewCount: 1 },
    { id: 'collection-algorithm', name: '알고리즘', section: '001', tone: 'blue', taskCount: 2, noticeCount: 1, reviewCount: 0 },
    { id: 'collection-hci', name: '인간컴퓨터상호작용', section: '001', tone: 'purple', taskCount: 2, noticeCount: 1, reviewCount: 1 },
    { id: 'collection-database', name: '데이터베이스', section: '002', tone: 'sand', taskCount: 1, noticeCount: 1, reviewCount: 1 },
  ]
  const courses = rows.map<CollectedCourse>(course => ({
    ...course, status: 'updated', lastSuccessAt: attemptedAt, lastAttemptAt: attemptedAt, error: null,
  }))
  return {
    state: scenario === 'expired' ? 'expired' : 'connected', lastAttemptAt: attemptedAt,
    lastSuccessAt: scenario === 'expired' ? previousAt : attemptedAt,
    courses: courses.map(course => scenario === 'expired'
      ? { ...course, status: 'expired', lastSuccessAt: previousAt }
      : scenario === 'partial' && course.id === 'collection-hci'
        ? { ...course, status: 'failed', lastSuccessAt: previousAt, error: '예시: 학교의 응답을 받지 못했습니다. 이전에 확인한 기록을 유지합니다.' }
        : course),
  }
}

export function createSuccessfulCollectionResults(courses: CollectedCourse[]): CollectionResult[] {
  return courses.map(course => ({
    courseId: course.id, ok: true, taskCount: course.taskCount, noticeCount: course.noticeCount, reviewCount: course.reviewCount,
  }))
}
