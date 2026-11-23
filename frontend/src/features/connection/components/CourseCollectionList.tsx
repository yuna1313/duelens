import { Icon } from '@/components/ui/Icon'
import { collectionStateLabels, collectionTimestamp } from '../model'
import type { CollectedCourse } from '../model'
import './CourseCollectionList.css'

export function CourseCollectionList({ courses, canRetry, onRetry }: { courses: CollectedCourse[]; canRetry: boolean; onRetry: (id: string) => void }) {
  return (
    <section className="panel course-collection-panel" aria-label="과목별 수집 상태">
      <header><div><h2>과목별 수집 상태</h2><p>학교에서 가져온 결과를 보여 주는 예시 과목입니다.</p></div><span>{courses.length}개 과목</span></header>
      <ul>{courses.map(course => (
        <li key={course.id}>
          <article aria-labelledby={`collection-${course.id}`}>
            <div className="collection-course"><span className={`collection-course-icon ${course.tone}`}>{course.name.slice(0, 1)}</span><div><h3 id={`collection-${course.id}`}>{course.name}</h3><p>{course.section}분반</p></div></div>
            <dl>
              <div><dt>수집 상태</dt><dd><span className={`collection-state ${course.status}`}>{collectionStateLabels[course.status]}</span></dd></div>
              <div><dt>마지막 성공</dt><dd>{collectionTimestamp(course.lastSuccessAt)}<small>마지막 시도 {collectionTimestamp(course.lastAttemptAt)}</small></dd></div>
              <div><dt>보관한 예시 기록</dt><dd>과제 {course.taskCount} · 공지 {course.noticeCount}<small>검토 필요 {course.reviewCount}건</small></dd></div>
            </dl>
            {course.status === 'failed' && <div className="collection-course-error"><p><Icon name="info" size={13} />{course.error || '예시 수집에 실패했습니다. 이전 기록은 유지합니다.'}</p><button className="button secondary" type="button" disabled={!canRetry} onClick={() => onRetry(course.id)} aria-label={`${course.name} 재시도 예시`}>재시도 예시</button></div>}
          </article>
        </li>
      ))}</ul>
    </section>
  )
}
