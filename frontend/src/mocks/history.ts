import type { HistoryRecord, HistoryValues } from '@/features/history/model'
import { offsetDate } from '@/utils/date'

// 기록 당시의 값과 원문을 보관한 UI 예시입니다. 과제 수정·검토 결과에서 생성한 실제 이력이 아닙니다.
export function createPreviewHistory(today: string): HistoryRecord[] {
  const original: HistoryValues = {
    dueDate: offsetDate(today, 4), dueTime: '18:00', submissionFormat: 'HWP', quantity: '5쪽 이내', progress: '진행 중',
  }
  const reviewed: HistoryValues = { ...original, dueDate: offsetDate(today, 7), submissionFormat: 'PDF' }
  const edited: HistoryValues = { ...reviewed, dueDate: offsetDate(today, 5), dueTime: null }
  return [
    {
      id: 'report-v3', taskId: 'preview-report', version: 3, occurredAt: `${today}T13:20:00+09:00`, kind: 'manual-edit',
      before: { ...reviewed }, after: { ...edited }, note: '마감 날짜를 직접 수정하고, 확인되지 않은 시각은 미정으로 남긴 예시입니다.', source: null,
    },
    {
      id: 'report-v2', taskId: 'preview-report', version: 2, occurredAt: `${today}T12:05:00+09:00`, kind: 'notice-applied',
      before: { ...original }, after: { ...reviewed }, note: '공지의 변경 내용을 확인한 뒤 마감 날짜와 제출 형식을 선택해 반영한 예시입니다.',
      source: {
        noticeId: 'preview-report', title: '중간보고서 제출 기한 및 형식 변경', capturedAt: `${today}T11:42:00+09:00`, availability: 'available',
        evidence: `제출 기한을 ${offsetDate(today, 7)} 오후 6시까지로 연장합니다. 제출 파일 형식은 HWP 대신 PDF로 변경합니다.`,
        paragraphs: [
          '안녕하세요. 중간보고서 제출과 관련하여 변경 사항을 안내드립니다.',
          `충분한 검토 시간을 드리기 위해, 기존 ${offsetDate(today, 4)}이었던 제출 기한을 ${offsetDate(today, 7)} 오후 6시까지로 연장합니다.`,
          '파일 열람 오류를 방지하기 위해 제출 파일 형식은 HWP 대신 PDF로 변경합니다. 분량은 기존과 동일하게 5쪽 이내입니다.',
          '주제와 평가 기준은 기존 안내를 참고해 주세요. 마감 시각을 확인하시어 학교 과제란으로 제출 바랍니다.',
          '감사합니다.',
        ],
      },
    },
    {
      id: 'report-v1', taskId: 'preview-report', version: 1, occurredAt: `${offsetDate(today, -8)}T14:20:00+09:00`, kind: 'created',
      before: null, after: { ...original }, note: '최초 과제와 제출 조건을 등록한 예시입니다.',
      source: {
        noticeId: null, title: '중간보고서 최초 제출 안내', capturedAt: `${offsetDate(today, -8)}T14:20:00+09:00`, availability: 'expired',
        evidence: `중간보고서는 ${offsetDate(today, 4)} 오후 6시까지 HWP 파일로 제출해 주세요. 분량은 5쪽 이내입니다.`,
        paragraphs: [
          '선택한 주제에 대해 중간 진행 내용을 정리해 주세요. 주제 선정 배경, 조사 내용, 향후 계획을 포함합니다.',
          `중간보고서는 ${offsetDate(today, 4)} 오후 6시까지 HWP 파일로 제출해 주세요. 분량은 5쪽 이내입니다.`,
        ],
      },
    },
  ]
}
