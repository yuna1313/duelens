import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'
import { Brand } from '../ui/Brand'
import './WorkspaceLayout.css'

const pages = [
  { id: 'tasks', label: '내 과제', icon: 'grid' },
  { id: 'notices', label: '공지함', icon: 'inbox' },
  { id: 'notifications', label: '알림', icon: 'bell' },
  { id: 'courses', label: '과목·수업', icon: 'book' },
] as const

interface Props {
  children: ReactNode
  semester: string
  activePage?: 'tasks' | 'notices' | 'notifications' | 'courses'
  pageTitle?: string
}

export function WorkspaceLayout({ children, semester, activePage = 'courses', pageTitle }: Props) {
  const today = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date())
  const title = pageTitle ?? pages.find(page => page.id === activePage)?.label
  const storageLabel = activePage === 'courses' ? '이 기기에 저장' : '화면 미리보기'
  const navigation = pages.map(page => (
    <a
      key={page.id} href={`#/${page.id}`}
      className={`nav-item ${activePage === page.id ? 'active' : ''}`}
      aria-current={activePage === page.id ? 'page' : undefined}
    ><Icon name={page.icon} /><span>{page.label}</span></a>
  ))

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
        <nav aria-label="주 메뉴">{navigation}</nav>
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
        <nav className="mobile-navigation" aria-label="모바일 주 메뉴">{navigation}</nav>
      </div>
    </div>
  )
}
