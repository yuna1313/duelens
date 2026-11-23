import { readCourses, storageKey, writeCourses } from '../../features/courses/storage.ts'
import type { CourseState, CourseStorage } from '../../features/courses/storage.ts'

export const maxCourseBackupBytes = 4_000_000
export interface CourseDataStorage extends CourseStorage { removeItem(key: string): void }
export interface CourseSnapshot { data: CourseState; raw: string | null }
export interface CourseBackup { format: 'duelens-course-backup'; version: 1; exportedAt: string; data: CourseState }

function readRaw(storage: Pick<CourseStorage, 'getItem'>): string | null {
  try { return storage.getItem(storageKey) } catch { throw new Error('이 브라우저의 과목 정보를 읽을 수 없습니다. 기존 데이터를 변경하지 않았습니다.') }
}

export function readCourseSnapshot(storage: Pick<CourseStorage, 'getItem'>): CourseSnapshot {
  const raw = readRaw(storage)
  return { raw, data: readCourses({ getItem: () => raw }) }
}

export function createCourseBackup(storage: Pick<CourseStorage, 'getItem'>, exportedAt = new Date().toISOString()): string {
  const { data } = readCourseSnapshot(storage)
  const backup: CourseBackup = { format: 'duelens-course-backup', version: 1, exportedAt, data }
  const text = JSON.stringify(backup, null, 2)
  if (new TextEncoder().encode(text).byteLength > maxCourseBackupBytes) throw new Error('과목 백업이 허용된 파일 크기를 초과했습니다.')
  return text
}

export function parseCourseBackup(text: string): CourseBackup {
  if (text.length > maxCourseBackupBytes || new TextEncoder().encode(text).byteLength > maxCourseBackupBytes) throw new Error('과목 백업은 4MB 이하의 JSON 파일만 사용할 수 있습니다.')
  try {
    const data: unknown = JSON.parse(text)
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid backup')
    const value = data as Record<string, unknown>
    if (value.format !== 'duelens-course-backup' || value.version !== 1 || typeof value.exportedAt !== 'string'
      || !/^\d{4}-\d{2}-\d{2}T/.test(value.exportedAt) || !Number.isFinite(Date.parse(value.exportedAt))
      || Object.keys(value).some(key => !['format', 'version', 'exportedAt', 'data'].includes(key))) throw new Error('Unsupported backup')
    const courses = readCourses({ getItem: () => JSON.stringify(value.data) })
    return { format: 'duelens-course-backup', version: 1, exportedAt: value.exportedAt, data: courses }
  } catch { throw new Error('지원하는 과목 백업 파일이 아니거나 내용이 손상되었습니다. 기존 과목은 변경하지 않았습니다.') }
}

export function restoreCourseBackup(storage: CourseStorage, backup: CourseBackup, expectedRaw: string | null): CourseSnapshot {
  const data = parseCourseBackup(JSON.stringify(backup)).data
  if (readRaw(storage) !== expectedRaw) throw new Error('검토 중 다른 창에서 과목이 바뀌었습니다. 창을 닫고 최신 내용을 다시 확인해 주세요.')
  writeCourses(storage, data)
  return { raw: JSON.stringify(data), data }
}

export function deleteStoredCourses(storage: CourseDataStorage, expectedRaw: string | null): CourseSnapshot {
  if (readRaw(storage) !== expectedRaw) throw new Error('확인 중 다른 창에서 과목이 바뀌었습니다. 창을 닫고 최신 내용을 다시 확인해 주세요.')
  try { storage.removeItem(storageKey) } catch { throw new Error('과목 정보를 삭제하지 못했습니다. 기존 데이터와 브라우저 저장 권한을 확인해 주세요.') }
  return { raw: null, data: readCourses({ getItem: () => null }) }
}
