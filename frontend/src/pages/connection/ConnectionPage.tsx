import { useEffect, useRef, useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { ConnectionGuideDialog } from '@/features/connection/components/ConnectionGuideDialog'
import { CourseCollectionList } from '@/features/connection/components/CourseCollectionList'
import {
  applyCollectionResults, collectionTimestamp, connectionScenarioLabels, connectionTotals,
  disconnectPreview, previewScenario, reconnectPreview,
} from '@/features/connection/model'
import type { ConnectionScenario } from '@/features/connection/model'
import { createConnectionPreview, createSuccessfulCollectionResults } from '@/mocks/connection'
import { seoulDateKey } from '@/utils/date'
import './ConnectionPage.css'

export function ConnectionPage() {
  const [today] = useState(seoulDateKey)
  const [preview, setPreview] = useState(() => createConnectionPreview(today, 'disconnected'))
  const [dialog, setDialog] = useState<'connect' | 'reconnect' | 'disconnect' | null>(null)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const actionRef = useRef<HTMLButtonElement>(null)
  const focusAfterConfirm = useRef(false)
  const scenario = previewScenario(preview)
  const totals = connectionTotals(preview.courses)
  const waiting = preview.courses.some(course => course.status === 'waiting')
  const [year, month] = today.split('-').map(Number)
  const semester = `${month < 3 ? year - 1 : year}년 ${month >= 3 && month <= 8 ? 1 : 2}학기`
  const statusLabel = preview.state === 'expired' ? '재연결 필요' : preview.state === 'connected' ? '연결됨' : '미연결'
  useEffect(() => {
    if (!dialog && focusAfterConfirm.current) {
      focusAfterConfirm.current = false
      actionRef.current?.focus({ preventScroll: true })
    }
  }, [dialog])

  function chooseScenario(value: ConnectionScenario) {
    setPreview(createConnectionPreview(today, value))
    setMessage('')
    setFailure('')
  }

  function refresh(id?: string) {
    try {
      const courses = id ? preview.courses.filter(course => course.id === id) : preview.courses
      setPreview(applyCollectionResults(preview, createSuccessfulCollectionResults(courses), new Date().toISOString()))
      setFailure('')
      setMessage(id ? '해당 과목의 재시도 성공 예시를 표시했습니다. 다른 과목의 기록은 유지했습니다.' : '전체 과목의 수집 성공 예시를 표시했습니다. 실제 학교 요청은 수행하지 않았습니다.')
    } catch (error) {
      setMessage('')
      setFailure(error instanceof Error ? error.message : '예시 수집 결과를 표시하지 못했습니다.')
    }
  }

  return (
    <WorkspaceLayout semester={semester} activePage="connection">
      <div className="page-heading"><div><h1>학교 연결</h1><p>연결 상태와 과목별 수집 결과를 확인하세요.</p></div><a className="button secondary connection-start-link" href="#/start">시작 안내</a></div>
      <section className="connection-preview-banner" aria-label="학교 연결 미리보기 안내"><Icon name="info" size={18} /><div><strong>학교 연결 화면 미리보기</strong><p>실제 학교는 연결되지 않았습니다. 아래 연결·수집 결과는 예시이며, 등록한 과목·과제와 별도로 표시됩니다.</p></div></section>
      <div className="connection-example-controls"><label htmlFor="connection-scenario">상황 예시</label><select id="connection-scenario" value={scenario} onChange={event => chooseScenario(event.target.value as ConnectionScenario)}>{(Object.entries(connectionScenarioLabels) as [ConnectionScenario, string][]).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button type="button" onClick={() => chooseScenario('disconnected')}>예시 초기화</button></div>
      <section className="panel connection-school-card" aria-label="학교 연결 예시 상태">
        <span className="connection-school-icon"><Icon name="book" size={26} /></span>
        <div className="connection-school-info"><h2>인하대학교 I-Class</h2><p>learn.inha.ac.kr</p></div>
        <span className={`connection-status ${preview.state}`}>{statusLabel} · 예시</span>
        <div className="connection-school-actions">
          {preview.state === 'connected' ? <button ref={actionRef} className="button primary" type="button" onClick={() => refresh()}><Icon name="refresh" size={14} />예시 수집 갱신</button>
            : <button ref={actionRef} className="button primary" type="button" onClick={() => setDialog(preview.courses.length ? 'reconnect' : 'connect')}><Icon name="link" size={14} />{preview.state === 'expired' ? '재연결 안내' : preview.courses.length ? '다시 연결 안내' : '연결 과정 보기'}</button>}
          {preview.state !== 'disconnected' && <button className="button secondary" type="button" onClick={() => setDialog('disconnect')}>예시 연결 해제</button>}
        </div>
      </section>
      {preview.state === 'expired' && <div className="connection-attention" role="status"><Icon name="info" size={17} /><p><strong>인증 연결이 만료된 상황입니다.</strong>수집을 중단하고 기존 기록을 유지합니다. 재연결 안내에서 복구 흐름을 확인해 보세요.</p></div>}
      {scenario === 'partial' && <div className="connection-attention" role="status"><Icon name="info" size={17} /><p><strong>일부 과목의 수집에 실패했어요.</strong>성공한 과목의 결과와 이전 기록을 유지했습니다. 실패한 과목에서 재시도 예시를 확인할 수 있습니다.</p></div>}
      {preview.state === 'disconnected' && preview.courses.length > 0 && <div className="connection-attention neutral" role="status"><Icon name="shield" size={17} /><p><strong>예시 연결을 해제해 수집을 중단했습니다.</strong>이전에 보관한 예시 기록과 마지막 성공 시각은 남아 있습니다.</p></div>}
      {preview.state === 'connected' && waiting && <div className="connection-attention neutral" role="status"><Icon name="clock" size={17} /><p><strong>예시 연결을 복구했습니다. 아직 수집 전입니다.</strong>기존 기록을 유지한 수집 대기 상태입니다. ‘예시 수집 갱신’으로 다음 흐름을 확인해 보세요.</p></div>}
      {preview.courses.length > 0 ? (
        <>
          <dl className="connection-totals"><div><dt>보관한 예시 과제</dt><dd>{totals.tasks}<small>개</small></dd></div><div><dt>보관한 예시 공지</dt><dd>{totals.notices}<small>개</small></dd></div><div><dt>검토 필요</dt><dd>{totals.reviews}<small>건</small></dd></div></dl>
          <CourseCollectionList courses={preview.courses} canRetry={preview.state === 'connected'} onRetry={refresh} />
          <dl className="connection-collection-times"><div><dt>마지막 수집 시도</dt><dd>{collectionTimestamp(preview.lastAttemptAt)}</dd></div><div><dt>마지막 수집 성공</dt><dd>{collectionTimestamp(preview.lastSuccessAt)}</dd></div><div><dt>시간대</dt><dd>한국 표준시 (UTC+9)</dd></div></dl>
        </>
      ) : (
        <section className="panel connection-empty"><span><Icon name="link" size={29} /></span><h2>아직 학교를 연결하지 않았어요.</h2><p>연결 과정을 살펴보거나 상황 예시를 선택해 수집 결과를 확인해 보세요. 학교 연결 없이도 과제와 공지를 직접 입력할 수 있습니다.</p></section>
      )}
      {message && <p className="connection-operation-message" role="status"><Icon name="check" size={15} />{message}</p>}
      {failure && <p className="connection-operation-error" role="alert">{failure}</p>}
      <section className="panel connection-manual-panel"><h2>학교 연결 없이도 사용할 수 있어요.</h2><p>기존 과제를 확인하거나 직접 과제를 추가해 보세요.<br />공지함에서 ‘공지 붙여넣기’를 선택해 원문을 직접 입력할 수 있습니다.</p><div><a className="button secondary" href="#/tasks/new"><Icon name="plus" size={14} />과제 직접 추가</a><a className="button secondary" href="#/notices"><Icon name="file" size={14} />공지함에서 직접 입력</a><a className="button secondary" href="#/courses"><Icon name="book" size={14} />내 과목 관리</a><a className="connection-manual-tasks" href="#/tasks">기존 과제 보기<Icon name="arrow" size={13} /></a></div></section>
      <p className="connection-footer-note"><Icon name="shield" size={14} />학교 인증·수집·저장은 수행하지 않습니다. 화면을 벗어나거나 새로고침하면 예시 변경이 초기화됩니다.</p>
      {dialog && <ConnectionGuideDialog mode={dialog} onClose={() => setDialog(null)} onConfirm={() => {
        focusAfterConfirm.current = true
        if (dialog === 'disconnect') {
          setPreview(disconnectPreview(preview))
          setMessage('예시 연결을 해제했습니다. 기존 예시 기록과 마지막 성공 시각을 유지했습니다.')
        } else if (preview.courses.length) {
          setPreview(reconnectPreview(preview))
          setMessage('재연결 예시를 표시했습니다. 기존 기록을 유지하며 수집을 기다립니다.')
        } else {
          setPreview(createConnectionPreview(today, 'connected'))
          setMessage('연결된 상황의 예시입니다. 실제 학교 인증은 수행하지 않았습니다.')
        }
        setFailure('')
        setDialog(null)
      }} />}
    </WorkspaceLayout>
  )
}
