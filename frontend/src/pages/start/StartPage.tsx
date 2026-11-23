import { Brand } from '@/components/ui/Brand'
import { Icon } from '@/components/ui/Icon'
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

export function StartPage() {
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
            <h2 id="start-welcome-title">이번 학기, 함께 시작해요.</h2>
            <p className="start-options-lead">학교 계정 없이도 과목과 과제를 직접 정리할 수 있어요.</p>
            <div className="start-school-card">
              <div className="start-school-heading"><span className="start-school-icon"><Icon name="book" size={23} /></span><div><h3>인하대학교 I-Class</h3><span>learn.inha.ac.kr</span></div></div>
              <a className="button secondary" href="#/connection" aria-describedby="start-school-status"><Icon name="link" size={15} />학교 연결 화면 보기</a>
              <p id="start-school-status">연결 상태와 수집 흐름을 예시로 확인할 수 있습니다.<br />실제 학교 로그인·공지 수집은 아직 제공하지 않습니다.</p>
            </div>
            <div className="start-divider"><span>학교 연결 없이 시작하기</span></div>
            <a className="button primary start-manual-action" href="#/courses"><Icon name="book" size={15} />직접 입력으로 시작하기<Icon name="arrow" size={15} /></a>
            <p className="start-manual-description">과목 등록부터 차근차근 시작해 보세요.</p>
            <div className="start-secondary-actions"><a href="#/tasks/new"><Icon name="plus" size={13} />과제 바로 추가하기</a><a href="#/tasks">예시 화면 둘러보기<Icon name="arrow" size={13} /></a></div>
            <details className="start-data-notice">
              <summary><Icon name="info" size={13} />입력한 내용은 어떻게 관리되나요?</summary>
              <div>
                <p>과목 정보와 알림 옵션은 이 브라우저에 저장됩니다. 브라우저 데이터를 삭제하면 기록도 삭제됩니다. 설정의 데이터 관리에서 저장한 과목을 백업할 수 있습니다.</p>
                <p>과제·공지 입력과 검토·읽음 상태는 각 화면에서만 유지됩니다. 다른 메뉴로 나가거나 새로고침하면 초기화됩니다.</p>
                <p>현재 화면에서는 학교 비밀번호를 받거나 AI 분석·서버 저장을 수행하지 않습니다.</p>
              </div>
            </details>
          </div>
        </section>
      </main>
    </>
  )
}
