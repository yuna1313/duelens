export type ConnectionScenario = 'disconnected' | 'connected' | 'expired' | 'partial'
export type ConnectionState = 'disconnected' | 'connected' | 'expired'
export type CollectionState = 'updated' | 'failed' | 'expired' | 'paused' | 'waiting'

export interface CollectedCourse {
  id: string
  name: string
  section: string
  tone: 'green' | 'blue' | 'purple' | 'sand'
  status: CollectionState
  lastSuccessAt: string | null
  lastAttemptAt: string | null
  taskCount: number
  noticeCount: number
  reviewCount: number
  error: string | null
}

export interface ConnectionPreview {
  state: ConnectionState
  courses: CollectedCourse[]
  lastAttemptAt: string | null
  lastSuccessAt: string | null
}

export type CollectionResult = { courseId: string } & (
  { ok: true; taskCount: number; noticeCount: number; reviewCount: number }
  | { ok: false; reason: string }
)

export const connectionScenarioLabels: Record<ConnectionScenario, string> = {
  disconnected: '미연결', connected: '연결됨', expired: '연결 만료', partial: '일부 수집 실패',
}
export const collectionStateLabels: Record<CollectionState, string> = {
  updated: '업데이트됨', failed: '수집 실패', expired: '연결 만료', paused: '수집 중단', waiting: '수집 대기',
}

export function previewScenario(preview: ConnectionPreview): ConnectionScenario {
  return preview.state === 'connected' && preview.courses.some(course => course.status === 'failed') ? 'partial' : preview.state
}

export function connectionTotals(courses: CollectedCourse[]): { tasks: number; notices: number; reviews: number } {
  return courses.reduce((total, course) => ({
    tasks: total.tasks + course.taskCount, notices: total.notices + course.noticeCount, reviews: total.reviews + course.reviewCount,
  }), { tasks: 0, notices: 0, reviews: 0 })
}

export function disconnectPreview(preview: ConnectionPreview): ConnectionPreview {
  return { ...preview, state: 'disconnected', courses: preview.courses.map(course => ({ ...course, status: 'paused' })) }
}

export function reconnectPreview(preview: ConnectionPreview): ConnectionPreview {
  return { ...preview, state: 'connected', courses: preview.courses.map(course => ({ ...course, status: 'waiting' })) }
}

// 예시 수집 결과만 합칩니다. 인증·네트워크 요청·실제 저장을 수행하지 않습니다.
export function applyCollectionResults(preview: ConnectionPreview, results: CollectionResult[], attemptedAt: string): ConnectionPreview {
  if (preview.state !== 'connected') throw new Error('연결된 예시에서만 수집 결과를 확인할 수 있습니다.')
  const ids = new Set<string>()
  for (const result of results) {
    if (ids.has(result.courseId) || !preview.courses.some(course => course.id === result.courseId)) throw new Error('수집 대상 과목을 다시 확인해 주세요.')
    ids.add(result.courseId)
    if (result.ok && (![result.taskCount, result.noticeCount, result.reviewCount].every(value => Number.isSafeInteger(value) && value >= 0) || result.reviewCount > result.noticeCount)) {
      throw new Error('수집 결과의 기록 수를 확인해 주세요.')
    }
  }
  if (!results.length) return preview
  return {
    ...preview, lastAttemptAt: attemptedAt,
    lastSuccessAt: results.some(result => result.ok) ? attemptedAt : preview.lastSuccessAt,
    courses: preview.courses.map(course => {
      const result = results.find(item => item.courseId === course.id)
      if (!result) return course
      if (!result.ok) return { ...course, status: 'failed', lastAttemptAt: attemptedAt, error: result.reason }
      return {
        ...course, status: 'updated', lastAttemptAt: attemptedAt, lastSuccessAt: attemptedAt,
        taskCount: result.taskCount, noticeCount: result.noticeCount, reviewCount: result.reviewCount, error: null,
      }
    }),
  }
}

export function collectionTimestamp(timestamp: string | null): string {
  return timestamp ? new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(timestamp)) : '아직 없음'
}
