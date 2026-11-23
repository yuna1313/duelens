import { offsetDate } from '@/utils/date'
import type { Notice } from '@/features/notices/model'

// 원문·검토 요약까지 화면 확인용으로 작성한 예시입니다. 학교 수집·AI 분석 결과가 아닙니다.
export function createPreviewNotices(today: string): Notice[] {
  return [
    {
      id: 'preview-report', course: '프로그래밍 기초', title: '중간보고서 제출 기한 및 형식 변경',
      excerpt: '중간보고서는 연장된 기한에 맞춰 PDF로 제출해 주세요.',
      publishedAt: `${today}T11:30:00+09:00`, status: 'review', isRead: false, source: 'example',
      paragraphs: [
        '안녕하세요. 중간보고서 제출과 관련하여 변경 사항을 안내드립니다.',
        `충분한 검토 시간을 드리기 위해, 기존 ${offsetDate(today, 4)}이었던 제출 기한을 ${offsetDate(today, 7)} 오후 6시까지로 연장합니다.`,
        '파일 열람 오류를 방지하기 위해 제출 파일 형식은 HWP 대신 PDF로 변경합니다. 분량은 기존과 동일하게 5쪽 이내입니다.',
        '주제와 평가 기준은 기존 안내를 참고해 주세요. 마감 시각을 확인하시어 학교 과제란으로 제출 바랍니다.',
        '감사합니다.',
      ],
      summary: {
        taskTitle: '중간보고서', description: '마감일과 제출 형식의 변경을 비교하는 예시입니다.',
        fields: [
          { label: '마감일', before: `${offsetDate(today, 4)} 18:00`, after: `${offsetDate(today, 7)} 18:00` },
          { label: '제출 형식', before: 'HWP', after: 'PDF' },
          { label: '분량', after: '5쪽 이내 · 변경 없음' },
        ],
      },
    },
    {
      id: 'preview-prototype', course: '인간컴퓨터상호작용', title: '프로토타입 개선안 제출 안내',
      excerpt: '다음 수업 전까지 개선안을 정리해 주세요.',
      publishedAt: `${today}T09:10:00+09:00`, status: 'date-check', isRead: false, source: 'example',
      paragraphs: ['지난 피드백을 바탕으로 프로토타입 개선안을 정리해 주세요.', '다음 수업 전까지 개선안을 제출해 주세요. 변경한 부분과 개선 이유를 함께 정리해 주시기 바랍니다.'],
      summary: {
        taskTitle: '프로토타입 개선안', description: '정확한 날짜와 시각을 직접 확인해야 하는 예시입니다.',
        fields: [{ label: '공지의 마감 표현', after: '다음 수업 전까지' }, { label: '마감 날짜·시각', after: '확인 필요 · 임의로 확정하지 않음' }],
      },
    },
    {
      id: 'preview-database', course: '데이터베이스', title: 'ER 다이어그램 설계 보고서 안내',
      excerpt: '개체와 관계를 정의하고 설계 과정을 보고서로 정리해 주세요.',
      publishedAt: `${offsetDate(today, -1)}T16:25:00+09:00`, status: 'new-task', isRead: false, source: 'example',
      paragraphs: ['실습에서 다룬 주제를 바탕으로 ER 다이어그램을 설계해 주세요.', `${offsetDate(today, 4)} 23:59까지 설계 보고서를 PDF로 제출해 주세요.`],
      summary: {
        taskTitle: 'ER 다이어그램 설계 보고서', description: '새 과제의 제출 조건을 보여 주는 예시입니다.',
        fields: [{ label: '마감일', after: `${offsetDate(today, 4)} 23:59` }, { label: '제출 형식', after: 'PDF' }],
      },
    },
    {
      id: 'preview-algorithm', course: '알고리즘', title: '7주차 실습 자료 및 과제',
      excerpt: '그래프 탐색 실습 자료를 확인하세요.',
      publishedAt: `${offsetDate(today, -2)}T14:00:00+09:00`, status: 'applied', isRead: true, source: 'example',
      paragraphs: ['7주차 그래프 탐색 실습 자료와 과제를 안내합니다.', 'BFS와 DFS를 구현하고 탐색 결과를 비교해 주세요.'],
    },
    {
      id: 'preview-materials', course: '프로그래밍 기초', title: '수업 자료 업로드 안내',
      excerpt: '이번 주 강의자료가 업로드되었습니다.',
      publishedAt: `${offsetDate(today, -3)}T10:00:00+09:00`, status: 'no-task', isRead: true, source: 'example',
      paragraphs: ['이번 주 강의자료가 업로드되었습니다.', '수업 전에 예제 코드를 확인해 주세요. 별도 제출 과제는 없습니다.'],
    },
  ]
}
