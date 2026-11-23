import { useEffect, useId, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import './ConnectionGuideDialog.css'

export function ConnectionGuideDialog({ mode, onClose, onConfirm }: {
  mode: 'connect' | 'reconnect' | 'disconnect'
  onClose: () => void
  onConfirm: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const disconnecting = mode === 'disconnect'
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  return (
    <dialog ref={dialogRef} className="connection-guide-dialog" aria-labelledby={headingId} onCancel={event => { event.preventDefault(); onClose() }}>
      <header><div><span className="eyebrow">CONNECTION PREVIEW</span><h2 id={headingId}>{disconnecting ? '예시 연결을 해제할까요?' : mode === 'reconnect' ? '학교 재연결 안내' : '학교 연결 안내'}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="연결 안내 닫기"><Icon name="close" size={21} /></button></header>
      {disconnecting ? (
        <div className="connection-guide-body"><p>예시 연결을 해제하면 수집 상태가 중단으로 바뀝니다. 기존 예시 과제·공지 건수와 마지막 성공 시각은 유지합니다.</p><div className="connection-guide-notice"><Icon name="info" size={16} /><p>이 화면의 예시만 변경합니다. 실제 학교 연결을 해제하거나 저장된 과목·과제를 삭제하지 않습니다.</p></div></div>
      ) : (
        <div className="connection-guide-body">
          <p>실제 연결은 다음 순서로 진행할 예정입니다. 현재는 학교 계정이나 비밀번호를 입력하지 않는 화면 예시입니다.</p>
          <ol><li><span>1</span><div><h3>학교 인증 확인</h3><p>검증된 학교 인증 경로에서 계정을 확인합니다.</p></div></li><li><span>2</span><div><h3>학기·수집 과목 선택</h3><p>가져올 과목을 확인하고 선택합니다.</p></div></li><li><span>3</span><div><h3>과제·공지와 수집 결과 확인</h3><p>일부 수집이 실패해도 성공 결과와 기존 기록을 남깁니다.</p></div></li></ol>
          <div className="connection-guide-notice"><Icon name="shield" size={16} /><p>{mode === 'reconnect' ? '재연결 예시는 기존 기록을 유지한 채 수집 대기 상태로 돌아갑니다.' : '아래 버튼에서 연결된 상황의 예시 화면을 살펴볼 수 있습니다.'} 실제 로그인·수집은 수행하지 않습니다.</p></div>
        </div>
      )}
      <footer><button className="button secondary" type="button" onClick={onClose}>취소</button><button className={`button ${disconnecting ? 'secondary' : 'primary'}`} type="button" onClick={onConfirm}>{disconnecting ? '예시 연결 해제' : mode === 'reconnect' ? '재연결 예시 보기' : '연결된 예시 보기'}</button></footer>
    </dialog>
  )
}
