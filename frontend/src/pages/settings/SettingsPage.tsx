import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { Toggle } from '@/components/ui/Toggle'
import { currentTerm, termLabel } from '@/domain/academicTerm'
import { BrowserNotificationNotice } from '@/features/notifications/components/BrowserNotificationNotice'
import { ReminderSettings } from '@/features/settings/components/ReminderSettings'
import type { useReminderPreferences } from '@/features/settings/hooks/useReminderPreferences'
import { CourseDataPanel } from './CourseDataPanel'
import './SettingsPage.css'

export type SettingsTab = 'reminders' | 'data' | 'privacy'
const sections = [
  { id: 'reminders', label: '알림 설정', href: '#/settings', icon: 'bell' },
  { id: 'data', label: '데이터 관리', href: '#/settings/data', icon: 'file' },
  { id: 'privacy', label: '서비스·데이터 안내', href: '#/settings/privacy', icon: 'shield' },
] as const

export function SettingsPage({ tab, preferences, onCoursesChanged }: { tab: SettingsTab; preferences: ReturnType<typeof useReminderPreferences>; onCoursesChanged: () => void }) {
  return (
    <WorkspaceLayout semester={termLabel(currentTerm())} activePage="settings" pageTitle="설정·데이터 관리">
      <div className="page-heading"><div><h1>설정</h1><p>알림 옵션과 이 브라우저에 보관한 데이터를 관리하세요.</p></div></div>
      <section className="settings-storage-notice" aria-label="설정 저장 범위"><Icon name="info" size={18} /><div><strong>이 브라우저의 설정과 과목을 관리합니다.</strong><p>과목 정보와 알림 옵션은 이 기기에 저장합니다. 학교 연결·AI 분석·실제 알림 발송은 후속 단계에서 제공할 예정입니다.</p></div></section>
      <div className="settings-grid">
        <nav className="settings-navigation" aria-label="설정 메뉴">{sections.map(section => <a key={section.id} href={section.href} aria-current={tab === section.id ? 'page' : undefined} className={tab === section.id ? 'active' : ''}><Icon name={section.icon} size={16} /><span>{section.label}</span></a>)}<a className="settings-connection-link" href="#/connection"><Icon name="link" size={16} /><span>학교 연결 관리</span><Icon name="chevron" size={12} /></a></nav>
        <div className="settings-content">
          {tab === 'reminders' && <><ReminderSettings preferences={preferences} /><BrowserNotificationNotice /><a className="settings-text-link" href="#/notifications">알림센터 미리보기<Icon name="arrow" size={13} /></a></>}
          {tab === 'data' && <CourseDataPanel onCoursesChanged={onCoursesChanged} />}
          {tab === 'privacy' && <>
            <section className="panel settings-info-panel"><h2>데이터 보관 안내</h2><dl className="settings-retention"><div><dt>과목·선택 학기</dt><dd>이 브라우저에 저장합니다. 데이터 관리에서 과목 백업·복원·삭제를 할 수 있습니다.</dd></div><div><dt>알림 옵션</dt><dd>이 브라우저에 저장하고 알림 예정 미리보기에 적용합니다. 과목 백업에는 포함하지 않으며 실제 예약·발송은 수행하지 않습니다.</dd></div><div><dt>과제·공지·검토·이력·알림</dt><dd>이 탭의 프론트 상태입니다. 메뉴를 이동해도 등록·변경·완료·읽음 상태를 유지하며 새로고침하면 초기화됩니다. 과목 백업에는 포함하지 않습니다.</dd></div><div><dt>학교 연결·수집 상태</dt><dd>별도 화면 예시이며 학교 연결 화면을 나가면 초기화됩니다. 실제 인증·수집은 수행하지 않습니다.</dd></div><div><dt>날짜·시간 기준</dt><dd>한국 표준시 (UTC+9)를 사용합니다.</dd></div></dl><p className="settings-info-note">브라우저·프로필·접속 주소가 다르면 별도 데이터입니다. 브라우저 데이터를 삭제하면 저장한 기록도 삭제됩니다. 서버 저장·기기 간 동기화는 아직 제공하지 않습니다.</p></section>
            <section className="panel settings-info-panel"><h2>AI·모델 학습 안내</h2><div className="settings-training-row"><div><h3 id="training-consent-label">모델 학습용 데이터 제공</h3><p>현재 제공하지 않는 기능입니다. 학습용 데이터를 수집하거나 외부로 전송하지 않습니다.</p></div><Toggle checked={false} labelledBy="training-consent-label" disabled /></div><p className="settings-info-note">학교 공지 수집, AI 분석, 모델 학습용 제공의 동의는 각각 구분하여 구현할 예정입니다. 현재는 학교 비밀번호를 입력받거나 실제 AI 분석을 요청하지 않습니다.</p><a className="settings-text-link" href="#/connection">학교 연결 화면 보기<Icon name="arrow" size={13} /></a></section>
          </>}
        </div>
      </div>
    </WorkspaceLayout>
  )
}
