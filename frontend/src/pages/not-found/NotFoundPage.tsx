import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { currentTerm, termLabel } from '@/domain/academicTerm'
import './NotFoundPage.css'

export function NotFoundPage() {
  return (
    <WorkspaceLayout semester={termLabel(currentTerm())} activePage={null}>
      <section className="panel not-found-page">
        <span className="not-found-icon"><Icon name="search" size={30} /></span>
        <p className="eyebrow">PAGE NOT FOUND</p><h1>이 페이지를 찾을 수 없어요.</h1>
        <p>주소가 올바른지 확인하거나 아래 메뉴에서 다시 시작해 주세요.<br />등록한 내용은 주소 이동만으로 삭제되지 않습니다.</p>
        <div><a className="button primary" href="#/tasks">내 과제로 이동</a><a className="button secondary" href="#/start">시작 안내</a></div>
      </section>
    </WorkspaceLayout>
  )
}
