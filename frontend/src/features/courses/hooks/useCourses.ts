import { useEffect, useState } from 'react'
import { CourseError, isTerm } from '../model'
import type { Course, CourseDraft, CourseErrors } from '../model'
import { readCourses, saveCourse, storageKey, writeCourses } from '../storage'
import type { CourseState } from '../storage'

interface Snapshot { data: CourseState | null; error: string | null }
export type SaveResult = { ok: true; course: Course } | { ok: false; message: string; fields: CourseErrors }

function loadSnapshot(): Snapshot {
  try { return { data: readCourses(window.localStorage), error: null } } catch (error) {
    return { data: null, error: error instanceof CourseError ? error.message : '브라우저의 저장 공간을 사용할 수 없습니다. 저장 권한을 확인해 주세요.' }
  }
}

export function useCourses() {
  const [snapshot, setSnapshot] = useState<Snapshot>(loadSnapshot)

  const reload = () => {
    const next = loadSnapshot()
    setSnapshot(previous => next.data ? next : { data: previous.data, error: next.error })
  }

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return
      const next = loadSnapshot()
      setSnapshot(previous => next.data ? next : { data: previous.data, error: next.error })
    }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [])

  function save(draft: CourseDraft, id?: string, revision?: number): SaveResult {
    try {
      const result = saveCourse(window.localStorage, draft, id ?? crypto.randomUUID(), revision)
      setSnapshot({ data: result.state, error: null })
      return { ok: true, course: result.course }
    } catch (error) {
      const problem = error instanceof CourseError ? error : new CourseError('저장하지 못했습니다. 브라우저의 저장 권한을 확인해 주세요.')
      return { ok: false, message: problem.message, fields: problem.fields }
    }
  }

  function selectTerm(term: string) {
    if (!isTerm(term)) return
    try {
      const next = { ...readCourses(window.localStorage), selectedTerm: term }
      writeCourses(window.localStorage, next)
      setSnapshot({ data: next, error: null })
    } catch (error) {
      setSnapshot(previous => ({ ...previous, error: error instanceof CourseError ? error.message : '선택한 학기를 저장하지 못했습니다.' }))
    }
  }

  return { ...snapshot, save, selectTerm, reload }
}
