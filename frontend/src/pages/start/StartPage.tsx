import { Brand } from '@/components/ui/Brand'
import { Icon } from '@/components/ui/Icon'
import { termLabel } from '@/domain/academicTerm'
import './StartPage.css'

function StartPreview() {
  return (
    <div className="start-preview" aria-hidden="true">
      <div className="start-preview-notice">
        <span className="start-preview-caption">화면 예시</span>
        <small>프로그래밍 기초 · 새 공지</small>
        <strong>중간보고서 제출 기한 연장</strong>
        <div><span><del>11.27</del><Icon name="arrow" size={13} />11.30</span><span className="start-preview-tag">변경 발견</span></div>
      </div>
      <div className="start-preview-task">
        <small>오늘의 과제</small>
        <strong><Icon name="check" size={16} />사용자 인터뷰 정리</strong>
        <div><span>작성 완료</span><span className="start-preview-tag">제출 확인이 남았어요</span></div>
      </div>
    </div>
  )
}

export function StartPage({ selectedTerm, onManualStart, onPreview }: { selectedTerm: string | null; onManualStart: () => void; onPreview: () => void }) {
  return (
    <>
      <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>본문으로 건너뛰기</a>
      <main id="main" className="start-page" tabIndex={-1}>
        <section className="start-introduction" aria-labelledby="start-title">
          <header><Brand href="#/start" /><span className="start-preview-label">화면 미리보기</span></header>
          <div className="start-intro-content">
            <span className="eyebrow">YOUR SEMESTER, IN FOCUS</span>
            <h1 id="start-title">공지부터 제출까지,<br />한곳에서 챙기세요.</h1>
            <p>과제와 제출 조건을 정리하고,<br />바뀐 마감일을 놓치지 않도록 확인하세요.</p>
            <StartPreview />
          </div>
          <footer>DueLens · 조금 더 가벼운 학교생활</footer>
        </section>
        <section className="start-options" aria-labelledby="start-welcome-title">
          <div className="start-options-content">
            <span className="eyebrow">WELCOME TO DUELENS</span>
            <h2 id="start-welcome-title">나에게 맞는 방법으로 시작해요.</h2>
            <p className="start-options-lead">학교 계정 없이도 과목과 과제를 직접 정리할 수 있어요.</p>
            <div className="start-term-status"><Icon name="calendar" size={19} /><div><strong>{selectedTerm ? `${termLabel(selectedTerm)} 선택됨` : '아직 학기를 선택하지 않았어요'}</strong><p>{selectedTerm ? '저장한 학기로 이어서 사용하거나 나중에 변경할 수 있어요.' : '지금 정하지 않아도 괜찮아요. 첫 과목을 등록할 때 선택해 주세요.'}</p></div></div>
            <div className="start-school-card">
              <div className="start-school-heading"><span className="start-school-icon"><Icon name="book" size={23} /></span><div><h3>인하대학교 I-Class</h3><span>learn.inha.ac.kr</span></div></div>
              <a className="button secondary" href="#/connection" aria-describedby="start-school-status"><Icon name="link" size={15} />학교 연결 화면 보기</a>
              <p id="start-school-status">연결 흐름을 예시로 살펴볼 수 있습니다.<br />실제 로그인·학기 정보 가져오기는 아직 제공하지 않습니다.</p>
            </div>
            <div className="start-divider"><span>학교 연결 없이 시작하기</span></div>
            <a className="button primary start-manual-action" href="#/courses" onClick={onManualStart}><Icon name="book" size={15} />과목 등록으로 시작하기<Icon name="arrow" size={15} /></a>
            <p className="start-manual-description">첫 과목 등록에서 연도와 학기를 함께 선택해요.</p>
            <div className="start-secondary-actions"><a href="#/tasks/new" onClick={onManualStart}><Icon name="plus" size={13} />과제 추가하기</a><a href="#/tasks" onClick={onPreview}>예시 화면 둘러보기<Icon name="arrow" size={13} /></a></div>
            <details className="start-data-notice">
              <summary><Icon name="info" size={13} />입력한 내용은 어떻게 관리되나요?</summary>
              <div>
                <p>과목 정보와 알림 옵션은 이 브라우저에 저장됩니다. 브라우저 데이터를 삭제하면 기록도 삭제됩니다. 설정의 데이터 관리에서 저장한 과목을 백업할 수 있습니다.</p>
                <p>등록한 과제·공지와 완료한 검토·이력·읽음 상태는 이 탭에서 메뉴를 이동해도 유지됩니다. 새로고침하면 초기화되며 과목 백업에는 포함하지 않습니다.</p>
                <p>현재 화면에서는 학교 비밀번호를 받거나 AI 분석·서버 저장을 수행하지 않습니다.</p>
              </div>
            </details>
          </div>
        </section>
      </main>
    </>
  )
}
