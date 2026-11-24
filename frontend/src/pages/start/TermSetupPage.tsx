import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { AcademicTermForm } from '@/components/ui/AcademicTermForm'
import { Icon } from '@/components/ui/Icon'
import './TermSetupPage.css'

interface Props {
  title: string
  activePage: 'tasks' | 'notices' | 'notifications'
  creatingTask: boolean
  enabled: boolean
  error: string | null
  onSelect: (term: string) => boolean
}

export function TermSetupPage({ title, activePage, creatingTask, enabled, error, onSelect }: Props) {
  return <WorkspaceLayout semester="학기 미선택" activePage={activePage}>
    <div className="page-heading"><div><h1>{title}</h1><p>{creatingTask ? '과제를 등록하기 전에 사용할 학기를 확인해 주세요.' : '학기를 선택하면 해당 학기의 과목과 과제를 확인할 수 있어요.'}</p></div></div>
    <section className="panel term-setup-panel" aria-labelledby="term-setup-title">
      <span className="term-setup-icon"><Icon name="calendar" size={27} /></span>
      <span className="eyebrow">GET STARTED</span>
      <h2 id="term-setup-title">어느 학기부터 정리할까요?</h2>
      <p>아직 선택한 학기가 없습니다. 연도와 학기를 확인해 주세요.<br />학기를 바꿔도 다른 학기의 기록은 그대로 남습니다.</p>
      <AcademicTermForm term={null} enabled={enabled} onSelect={onSelect} submitLabel={creatingTask ? '학기 선택하고 과제 등록' : '선택한 학기 보기'} />
      {error && <p className="academic-term-error" role="alert">{error}</p>}
    </section>
    <div className="term-setup-alternatives">
      <a href="#/courses"><Icon name="book" size={17} /><span><strong>과목부터 등록하기</strong><small>과목 등록에서 학기를 함께 선택해도 돼요.</small></span><Icon name="arrow" size={16} /></a>
      <a href="#/connection"><Icon name="link" size={17} /><span><strong>학교 연결 방식 살펴보기</strong><small>현재는 예시 화면이며 학기를 자동으로 가져오지 않아요.</small></span><Icon name="arrow" size={16} /></a>
    </div>
  </WorkspaceLayout>
}
