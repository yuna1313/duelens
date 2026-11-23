import { offsetDate } from '@/utils/date'
import type { TaskPreview } from '@/features/tasks/model'

// UI 확인용 데이터입니다. 학교에서 수집한 자료나 사용자가 저장한 과목과 연결되지 않습니다.
export function createPreviewTasks(today: string): TaskPreview[] {
  return [
    {
      id: 'preview-algorithm', title: '실습 과제 #7 — 그래프 탐색',
      course: '알고리즘', section: '001', tone: 'blue',
      dueDate: today, dueTime: '23:59', status: 'in-progress',
      source: 'example', submissionFormat: '소스 코드·보고서', quantity: '', submissionUrl: '',
      description: 'BFS와 DFS를 구현하고 두 탐색 방법의 결과를 비교하는 화면 예시입니다.',
    },
    {
      id: 'preview-interview', title: '사용자 인터뷰 정리',
      course: '인간컴퓨터상호작용', section: '001', tone: 'purple',
      dueDate: today, dueTime: '18:00', status: 'written',
      source: 'example', submissionFormat: 'PDF', quantity: '', submissionUrl: '',
      description: '인터뷰 내용을 정리한 상태입니다. 작성 완료와 실제 제출 완료를 구분하는 화면 예시입니다.',
    },
    {
      id: 'preview-database', title: 'ER 다이어그램 설계 보고서',
      course: '데이터베이스', section: '002', tone: 'sand',
      dueDate: offsetDate(today, 2), dueTime: '23:59', status: 'todo',
      source: 'example', submissionFormat: 'PDF', quantity: '', submissionUrl: '',
      description: '개체와 관계를 정의하고 설계 과정을 보고서로 정리하는 화면 예시입니다.',
    },
    {
      id: 'preview-report', title: '중간보고서',
      course: '프로그래밍 기초', section: '001', tone: 'green',
      dueDate: offsetDate(today, 5), dueTime: null, status: 'in-progress',
      source: 'example', submissionFormat: 'PDF', quantity: '5쪽 이내', submissionUrl: '',
      description: '마감 날짜만 정해지고 시각은 아직 확인되지 않은 과제의 화면 예시입니다.',
    },
    {
      id: 'preview-prototype', title: '프로토타입 개선안',
      course: '인간컴퓨터상호작용', section: '001', tone: 'purple',
      dueDate: null, dueTime: null, status: 'todo',
      source: 'example', submissionFormat: '', quantity: '', submissionUrl: '',
      description: '마감 날짜를 확인해야 하는 과제의 화면 예시입니다. 날짜나 시각을 임의로 확정하지 않습니다.',
    },
    {
      id: 'preview-submitted', title: '실습 과제 #6 — 정렬 알고리즘',
      course: '알고리즘', section: '001', tone: 'blue',
      dueDate: offsetDate(today, -2), dueTime: '23:59', status: 'submitted',
      source: 'example', submissionFormat: '', quantity: '', submissionUrl: '',
      description: '제출 완료한 과제를 진행 중인 과제와 구분하는 화면 예시입니다.',
    },
  ]
}
