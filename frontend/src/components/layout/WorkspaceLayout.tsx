import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'
import { Brand } from '../ui/Brand'
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
  pageTitle?: string
}

export function WorkspaceLayout({ children, semester, activePage = 'courses', pageTitle }: Props) {
  const moreRef = useRef<HTMLDetailsElement>(null)
  const today = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date())
  const title = pageTitle ?? pages.find(page => page.id === activePage)?.label
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
        <div className="semester-label"><Icon name="calendar" size={15} />{semester}</div>
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
        <header className="topbar">
          <div className="breadcrumb">
            <span>내 워크스페이스</span><Icon name="chevron" size={13} /><span>{title}</span>
          </div>
          <div className="header-right"><span>{today}</span><span className="avatar">나</span></div>
        </header>
        <header className="mobile-top">
          <Brand /><span className="device-label"><Icon name="shield" size={14} />{storageLabel}</span>
        </header>
        <main id="main" className="page" tabIndex={-1}>{children}</main>
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
