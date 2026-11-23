import type { ReactNode } from 'react'
import { Icon } from './Icon'
import './WorkspaceLayout.css'

function Brand() {
  return <a href="#main" className="brand"><span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5h7a7 7 0 0 1 0 14H5V5Z" stroke="currentColor" strokeWidth="2.5" /><circle cx="11.5" cy="12" r="2.5" fill="currentColor" /></svg></span>DueLens</a>
}

export function WorkspaceLayout({ children, semester }: { children: ReactNode; semester: string }) {
  const today = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
  return <div className="workspace-layout">
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <aside className="sidebar">
      <Brand />
      <div className="semester-label"><Icon name="calendar" size={15} />{semester}</div>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="주 메뉴"><a className="nav-item active" href="#main" aria-current="page"><Icon name="book" />과목·수업</a></nav>
      <div className="sidebar-bottom">
        <div className="connection-note"><span className="connection-dot" />학교 미연결<p>학교 연결 없이도 시작할 수 있어요.</p></div>
        <div className="workspace-profile"><span className="avatar">나</span><div><strong>나의 워크스페이스</strong><span>이 기기에 저장</span></div></div>
      </div>
    </aside>
    <div className="workspace-content">
      <header className="topbar"><div className="breadcrumb"><span>내 워크스페이스</span><Icon name="chevron" size={13} /><span>과목·수업</span></div><div className="header-right"><span>{today}</span><span className="avatar">나</span></div></header>
      <header className="mobile-top"><Brand /><span className="device-label"><Icon name="shield" size={14} />이 기기에 저장</span></header>
      <main id="main" className="page" tabIndex={-1}>{children}</main>
    </div>
  </div>
}
