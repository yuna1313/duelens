import { useContext, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'
import { Brand } from '../ui/Brand'
import { AcademicTermControl } from '../ui/AcademicTermControl'
import { AcademicTermContext } from '@/contexts/AcademicTermContext'
import './WorkspaceLayout.css'

const pages = [
  { id: 'tasks', label: '내 과제', icon: 'grid' },
  { id: 'notices', label: '공지함', icon: 'inbox' },
  { id: 'notifications', label: '알림', icon: 'bell' },
  { id: 'courses', label: '과목·수업', icon: 'book' },
  { id: 'connection', label: '학교 연결', icon: 'link' },
  { id: 'settings', label: '설정', icon: 'settings' },
] as const

interface Props {
  children: ReactNode
  semester: string
  activePage?: typeof pages[number]['id'] | null
}

export function WorkspaceLayout({ children, semester, activePage = 'courses' }: Props) {
  const moreRef = useRef<HTMLDetailsElement>(null)
  const term = useContext(AcademicTermContext)
  const storageLabel = activePage === 'courses' || activePage === 'settings' ? '이 기기에 저장' : '화면 미리보기'
  const navigationItem = (page: typeof pages[number]) => (
    <a
      key={page.id} href={`#/${page.id}`}
      className={`nav-item ${activePage === page.id ? 'active' : ''}`}
      aria-current={activePage === page.id ? 'page' : undefined}
      onClick={() => { if (moreRef.current) moreRef.current.open = false }}
    ><Icon name={page.icon} /><span>{page.label}</span></a>
  )

  return (
    <div className="workspace-layout">
      <a
        className="skip-link" href="#main"
        onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}
      >본문으로 건너뛰기</a>
      <aside className="sidebar">
        <Brand />
        <AcademicTermControl fallback={semester} />
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="주 메뉴">{pages.map(navigationItem)}</nav>
        <div className="sidebar-bottom">
          <div className="connection-note">
            <span className="connection-dot" />학교 미연결
            <p>학교 연결 없이도 시작할 수 있어요.</p>
          </div>
          <div className="workspace-profile">
            <span className="avatar">나</span>
            <div><strong>나의 워크스페이스</strong><span>{storageLabel}</span></div>
          </div>
        </div>
      </aside>
      <div className="workspace-content">
        <header className="mobile-top">
          <Brand /><AcademicTermControl fallback={semester} />
        </header>
        <main id="main" className="page" tabIndex={-1}>{term?.preview && <div className="term-preview-note" role="status"><Icon name="info" size={18} /><div><strong>예시 학기로 화면을 둘러보고 있어요.</strong><p>아직 사용할 학기를 저장하지 않았습니다. 직접 등록할 때 학기를 선택해 주세요.</p></div><a href="#/start" onClick={term.exitPreview}>예시 종료</a></div>}{children}</main>
        <nav className="mobile-navigation" aria-label="모바일 주 메뉴">
          {pages.slice(0, 3).map(navigationItem)}
          <details className="mobile-more" ref={moreRef} onKeyDown={event => {
            if (event.key === 'Escape' && moreRef.current?.open) {
              moreRef.current.open = false
              moreRef.current.querySelector('summary')?.focus()
            }
          }}>
            <summary className={`nav-item ${pages.slice(3).some(page => page.id === activePage) ? 'active' : ''}`}><Icon name="more" /><span>더보기</span></summary>
            <div className="mobile-more-links">{pages.slice(3).map(navigationItem)}</div>
          </details>
        </nav>
      </div>
    </div>
  )
}
