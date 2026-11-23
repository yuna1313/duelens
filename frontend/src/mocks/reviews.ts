import { offsetDate } from '../utils/date.ts'
import type { ReviewCandidate, ReviewTask, ReviewValues } from '../features/reviews/model.ts'

export const reviewRoutes: Record<string, string> = {
  'preview-report': 'report-change', 'preview-prototype': 'date-check', 'preview-database': 'target-check',
}

// 같은 과제 ID를 사용하는 검토 예시입니다. 실제 AI 분석 결과가 아닙니다.
export function createReviewExamples(today: string): { candidates: ReviewCandidate[]; tasks: ReviewTask[] } {
  const blank: ReviewValues = { dueDate: null, dueTime: null, submissionFormat: '', quantity: '' }
  const report: ReviewValues = { dueDate: offsetDate(today, 4), dueTime: '18:00', submissionFormat: 'HWP', quantity: '5쪽 이내' }
  const reportProposal = { dueDate: offsetDate(today, 7), dueTime: '18:00', submissionFormat: 'PDF' }
  const reportEvidence = `제출 기한을 ${offsetDate(today, 7)} 오후 6시까지로 연장합니다. 제출 파일 형식은 HWP 대신 PDF로 변경합니다.`
  return {
    tasks: [
      { id: 'preview-report', title: '중간보고서', course: '프로그래밍 기초', section: '001', values: { ...report } },
      { id: 'preview-prototype', title: '프로토타입 개선안', course: '인간컴퓨터상호작용', section: '001', values: { ...blank } },
      { id: 'preview-database', title: 'ER 다이어그램 설계 보고서', course: '데이터베이스', section: '002', values: { ...blank } },
      { id: 'preview-db-final', title: 'ER 다이어그램 최종 보고서', course: '데이터베이스', section: '002', values: { ...blank } },
      { id: 'preview-report-manual', title: '중간보고서 · 직접 수정 예시', course: '프로그래밍 기초', section: '001', values: { ...report, dueDate: offsetDate(today, 6) } },
    ],
    candidates: [
      {
        id: 'report-change', noticeId: 'preview-report', title: '중간보고서', course: '프로그래밍 기초', section: '001',
        label: '일반 변경', description: '마감일 · 제출 형식', expectedTaskId: 'preview-report', allowNew: false, needsDate: false,
        before: { ...report }, proposal: reportProposal, evidence: reportEvidence,
      },
      {
        id: 'date-check', noticeId: 'preview-prototype', title: '프로토타입 개선안', course: '인간컴퓨터상호작용', section: '001',
        label: '날짜 확인', description: '다음 수업 전까지', expectedTaskId: 'preview-prototype', allowNew: false, needsDate: true,
        before: { ...blank }, proposal: { dueDate: null, dueTime: null }, evidence: '다음 수업 전까지 개선안을 제출해 주세요.',
      },
      {
        id: 'target-check', noticeId: 'preview-database', title: 'ER 다이어그램 설계 보고서', course: '데이터베이스', section: '002',
        label: '연결 대상 확인', description: '새 과제 또는 기존 과제', expectedTaskId: null, allowNew: true, needsDate: false,
        before: { ...blank }, proposal: { dueDate: offsetDate(today, 4), dueTime: '23:59', submissionFormat: 'PDF' },
        evidence: `${offsetDate(today, 4)} 23:59까지 설계 보고서를 PDF로 제출해 주세요.`,
      },
      {
        id: 'manual-conflict', noticeId: 'preview-report', title: '중간보고서 · 직접 수정', course: '프로그래밍 기초', section: '001',
        label: '수정값 충돌', description: '직접 수정한 마감일 유지·변경', expectedTaskId: 'preview-report-manual', allowNew: false, needsDate: false,
        before: { ...report }, proposal: reportProposal, evidence: reportEvidence,
      },
    ],
  }
}
