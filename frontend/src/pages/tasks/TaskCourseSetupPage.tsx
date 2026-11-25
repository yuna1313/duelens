import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { termLabel } from '@/domain/academicTerm'
import './TasksPage.css'

export function TaskCourseSetupPage({ term, error }: { term: string | null; error: string | null }) {
  return <WorkspaceLayout semester={termLabel(term)} activePage="tasks">
    <div className="page-heading"><div><h1>과제 추가</h1><p>과제를 등록할 과목을 먼저 준비해 주세요.</p></div></div>
    <section className="panel task-empty">
      <span><Icon name="book" size={28} /></span>
      <h2>{term ? `${termLabel(term)}에 등록한 과목이 없어요.` : '과목을 먼저 등록해 주세요.'}</h2>
      <p>과제는 등록한 과목에 속합니다.<br />연도·학기와 과목·분반을 등록하면 과제 추가로 이어집니다.</p>
      {error ? <p role="alert">{error}</p> : <a className="button primary" href="#/courses/new/task"><Icon name="plus" size={16} />과목 등록하고 계속하기</a>}
      <a className="task-course-back" href="#/tasks">내 과제로 돌아가기</a>
    </section>
  </WorkspaceLayout>
}
