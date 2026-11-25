import type { Course } from '../features/courses/model.ts'
import { currentTerm } from '../domain/academicTerm.ts'

// 예시 과제 전용 과목입니다. 사용자 과목 저장·백업에는 포함하지 않습니다.
export function createPreviewCourses(today: string): Course[] {
  const term = currentTerm(new Date(`${today}T12:00:00+09:00`))
  return [
    { id: 'example-algorithm', name: '알고리즘', section: '001' },
    { id: 'example-hci', name: '인간컴퓨터상호작용', section: '001' },
    { id: 'example-database', name: '데이터베이스', section: '002' },
    { id: 'example-programming', name: '프로그래밍 기초', section: '001' },
  ].map(course => ({ ...course, term, days: [], startTime: null, revision: 1 }))
}
