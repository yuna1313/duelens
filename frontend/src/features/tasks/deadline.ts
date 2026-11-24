import type { TaskDraft } from './model.ts'

export interface RememberedDeadline { dueDate: string; dueTime: string }
export function changeDeadlineMode(draft: TaskDraft, unknown: boolean, remembered: RememberedDeadline) {
  return unknown
    ? { draft: { ...draft, dueDate: '', dueTime: '' }, remembered: { dueDate: draft.dueDate, dueTime: draft.dueTime } }
    : { draft: { ...draft, dueDate: remembered.dueDate, dueTime: remembered.dueTime }, remembered }
}
