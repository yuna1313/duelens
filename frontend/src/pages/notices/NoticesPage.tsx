import { useState } from 'react'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Icon } from '@/components/ui/Icon'
import { NoticeStatusBadge } from '@/features/notices/components/NoticeStatusBadge'
import { NoticeSummary } from '@/features/notices/components/NoticeSummary'
import { PasteNoticeDialog } from '@/features/notices/components/PasteNoticeDialog'
import { createManualNotice, filterNotices, noticeTabs, noticeTimestamp } from '@/features/notices/model'
import type { Notice, NoticeTab } from '@/features/notices/model'
import { createPreviewNotices } from '@/mocks/notices'
import { seoulDateKey } from '@/utils/date'
import { NoticeDocument } from './NoticeDocument'
import './NoticesPage.css'

function NoticeRow({ notice, onOpen }: { notice: Notice; onOpen: () => void }) {
  return (
    <li>
      <a href={`#/notices/${notice.id}`} className={`notice-row ${notice.isRead ? '' : 'unread'}`} onClick={onOpen}>
        <span className={`notice-row-icon ${notice.status === 'review' ? 'has-change' : ''}`}><Icon name={notice.status === 'review' ? 'refresh' : 'file'} size={18} /></span>
        <div className="notice-row-content">
          <div className="notice-row-meta">
            {!notice.isRead && <span className="notice-unread-dot" aria-label="읽지 않음" />}
            <span>{notice.course}</span><span>·</span><time dateTime={notice.publishedAt}>{noticeTimestamp(notice.publishedAt)}</time>
          </div>
          <h2>{notice.title}<NoticeStatusBadge status={notice.status} /></h2>
          <p>{notice.excerpt}</p>
        </div>
        <span className="notice-row-chevron"><Icon name="chevron" size={15} /></span>
      </a>
    </li>
  )
}

export function NoticesPage({ noticeId }: { noticeId: string | null }) {
  const [today] = useState(seoulDateKey)
  const [notices, setNotices] = useState(() => createPreviewNotices(today).map(notice => notice.id === noticeId ? { ...notice, isRead: true } : notice))
  const [showExamples, setShowExamples] = useState(true)
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [tab, setTab] = useState<NoticeTab>('all')
  const [pasting, setPasting] = useState(false)
  const [message, setMessage] = useState('')
  const source = notices.filter(notice => showExamples || notice.source === 'manual')
  const filtered = filterNotices(source, query, course, tab)
  const selected = source.find(notice => notice.id === noticeId)
  const preview = filtered.find(notice => notice.summary) ?? filtered[0]
  const courses = [...new Set(source.map(notice => notice.course))].sort((a, b) => a.localeCompare(b, 'ko'))
  const [year, month] = today.split('-').map(Number)
  const semester = `${month < 3 ? year - 1 : year}년 ${month >= 3 && month <= 8 ? 1 : 2}학기`

  function markRead(id: string) {
    setNotices(previous => previous.map(notice => notice.id === id ? { ...notice, isRead: true } : notice))
    setMessage('')
  }

  function resetFilters() { setQuery(''); setCourse('all'); setTab('all') }

  return (
    <WorkspaceLayout semester={semester} activePage="notices" pageTitle={noticeId ? '공지 원문' : '공지함'}>
      {noticeId ? selected ? (
        <NoticeDocument notice={selected} onToggleRead={() => {
          setNotices(previous => previous.map(notice => notice.id === selected.id ? { ...notice, isRead: !notice.isRead } : notice))
          setMessage(selected.isRead ? '이 공지를 읽지 않음으로 표시했습니다.' : '이 공지를 읽음으로 표시했습니다.')
        }} />
      ) : (
        <section className="panel notice-empty">
          <Icon name="file" size={30} /><h1>이 공지를 찾을 수 없어요.</h1>
          <p>직접 입력한 공지는 공지함을 벗어나거나 새로고침하면 초기화됩니다.</p>
          <a href="#/notices" className="button secondary">공지 목록으로</a>
        </section>
      ) : (
        <>
          <div className="page-heading notice-page-heading">
            <div><h1>공지함</h1><p>새 공지를 확인하고 제출 조건을 살펴보세요.</p></div>
            <button className="button primary" type="button" onClick={() => setPasting(true)}><Icon name="plus" size={16} />공지 붙여넣기</button>
          </div>
          <section className="notice-preview-banner" aria-label="화면 미리보기 안내">
            <Icon name="info" size={18} />
            <div><strong>예시 공지로 보는 화면 미리보기</strong><p>공지와 검토 요약은 화면 확인용 예시입니다. 실제 수집·분석 결과가 아닙니다.</p></div>
            <button type="button" className="button secondary" onClick={() => { setShowExamples(value => !value); resetFilters(); setMessage('') }}>
              {showExamples ? '예시 숨기기' : '예시 보기'}
            </button>
          </section>
          {source.length > 0 && (
            <div className="notice-filters">
              <div className="notice-search">
                <Icon name="search" size={16} /><label className="sr-only" htmlFor="notice-search">공지 검색</label>
                <input id="notice-search" type="search" placeholder="공지 제목이나 내용을 검색하세요" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} />
              </div>
              <label className="sr-only" htmlFor="notice-course-filter">공지 과목 필터</label>
              <select id="notice-course-filter" value={course} onChange={event => setCourse(event.target.value)}>
                <option value="all">모든 과목</option>{courses.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          )}
          <div className="notice-filter-tabs" role="group" aria-label="공지 처리 상태">
            {noticeTabs.map(item => (
              <button key={item.id} type="button" aria-pressed={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
                {item.label}<span>{filterNotices(source, query, course, item.id).length}</span>
              </button>
            ))}
          </div>
          <p className="notice-result-count" role="status">{filtered.length}개 공지 · 읽지 않음 {filtered.filter(notice => !notice.isRead).length}개</p>
          <div className={`notice-inbox-layout ${filtered.length ? '' : 'is-empty'}`}>
            {filtered.length ? (
              <section className="panel notice-list" aria-label="공지 목록">
                <ul>{filtered.map(notice => <NoticeRow key={notice.id} notice={notice} onOpen={() => markRead(notice.id)} />)}</ul>
              </section>
            ) : (
              <section className="panel notice-empty">
                <span className="notice-empty-icon"><Icon name={source.length ? 'search' : 'inbox'} size={28} /></span>
                <h2>{source.length ? '검색 조건에 맞는 공지가 없어요.' : '아직 등록된 공지가 없어요.'}</h2>
                <p>{source.length ? '검색어나 과목·처리 상태를 바꿔 다시 찾아보세요.' : '예시 공지를 살펴보거나 공지 원문을 직접 붙여넣어 보세요.'}</p>
                <button type="button" className="button secondary" onClick={source.length ? resetFilters : () => setPasting(true)}>
                  {source.length ? '필터 초기화' : '공지 붙여넣기'}
                </button>
              </section>
            )}
            {preview && <aside className="notice-inbox-aside"><NoticeSummary notice={preview} onOpen={() => markRead(preview.id)} /></aside>}
          </div>
        </>
      )}
      {message && <p className="notice-message" role="status"><Icon name="check" size={15} />{message}</p>}
      <p className="notice-footer-note"><Icon name="shield" size={14} />학교 미연결 · 공지함을 벗어나거나 새로고침하면 입력·읽음 상태가 초기화됩니다.</p>
      {pasting && <PasteNoticeDialog onClose={() => setPasting(false)} onCreate={draft => {
        const notice = createManualNotice(draft, crypto.randomUUID())
        setNotices(previous => [{ ...notice, isRead: true }, ...previous])
        setPasting(false)
        resetFilters()
        setMessage('원문 미리보기를 열었습니다. 입력 내용은 저장하거나 전송하지 않았습니다.')
        window.location.hash = `/notices/${notice.id}`
      }} />}
    </WorkspaceLayout>
  )
}
