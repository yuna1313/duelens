import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { currentWeek, dateLabel, isCalendarDate, offsetDate } from '@/utils/date'
import { adjacentMonth, monthCalendar } from '../weekCalendar'
import type { TaskPreview } from '../model'
import './WeekSchedule.css'

const weekdays = ['월', '화', '수', '목', '금', '토', '일']

export function WeekPicker({ date, today, onSelect, onClose }: {
  date: string; today: string; onSelect: (date: string) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const prefix = useId()
  const [month, setMonth] = useState(date.slice(0, 7))
  const selectedWeek = currentWeek(date)
  const previous = adjacentMonth(`${month}-01`, -1)
  const next = adjacentMonth(`${month}-01`, 1)
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = ref.current
    dialog?.showModal()
    dialog?.querySelector<HTMLButtonElement>('[data-selected-date]')?.focus()
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus() }
  }, [])

  return (
    <dialog ref={ref} className="week-picker" aria-labelledby={`${prefix}-title`} aria-describedby={`${prefix}-help`} onCancel={event => { event.preventDefault(); onClose() }}>
      <header><h2 id={`${prefix}-title`}>주 선택</h2><button type="button" className="icon-button" aria-label="주 선택 닫기" onClick={onClose}><Icon name="close" size={20} /></button></header>
      <p id={`${prefix}-help`}>날짜를 선택하면 그 날짜가 포함된 월요일~일요일의 과제 목록과 집계를 조회합니다.</p>
      <div className="week-picker-month">
        <button type="button" className="icon-button week-previous" aria-label="이전 달" disabled={!previous} onClick={() => previous && setMonth(previous.slice(0, 7))}><Icon name="chevron" size={16} /></button>
        <strong aria-live="polite">{Number(month.slice(0, 4))}년 {Number(month.slice(5, 7))}월</strong>
        <button type="button" className="icon-button" aria-label="다음 달" disabled={!next} onClick={() => next && setMonth(next.slice(0, 7))}><Icon name="chevron" size={16} /></button>
      </div>
      <div className="week-picker-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
      <div className="week-picker-days" role="group" aria-label={`${month} 날짜 선택`}>
        {monthCalendar(`${month}-01`).map(day => isCalendarDate(day) ? <button
          key={day} type="button" data-selected-date={day === date ? '' : undefined}
          className={`${day.startsWith(month) ? '' : 'outside-month'} ${selectedWeek.includes(day) ? 'selected-week' : ''}`}
          aria-label={`${day} ${dateLabel(day)}`} aria-pressed={selectedWeek.includes(day)} aria-current={day === today ? 'date' : undefined}
          onClick={() => onSelect(day)}
        >{Number(day.slice(-2))}</button> : <span key={day} />)}
      </div>
      <footer><button type="button" className="button secondary" onClick={onClose}>취소</button><button type="button" className="button primary" onClick={() => onSelect(today)}>이번 주로 이동</button></footer>
    </dialog>
  )
}

export function WeekSchedule({ today, date, tasks, onSelectWeek, onOpenPicker, pickerOpen }: {
  today: string; date: string; tasks: TaskPreview[]; onSelectWeek: (date: string) => void
  onOpenPicker: () => void; pickerOpen: boolean
}) {
  const week = currentWeek(date)
  const isCurrentWeek = week[0] === currentWeek(today)[0]
  const previous = offsetDate(date, -7)
  const next = offsetDate(date, 7)
  return (
    <section className="panel task-week-card" aria-label="주간 마감 일정">
      <header><h2>{isCurrentWeek ? '이번 주 일정' : '선택한 주 일정'}</h2><button type="button" className="icon-button" aria-label="달력에서 주 선택" aria-haspopup="dialog" aria-expanded={pickerOpen} title="달력에서 주 선택" onClick={onOpenPicker}><Icon name="calendar" size={17} /></button></header>
      <div className="task-week-navigation">
        <button type="button" className="icon-button week-previous" aria-label="이전 주" disabled={!isCalendarDate(previous)} onClick={() => onSelectWeek(previous)}><Icon name="chevron" size={14} /></button>
        <span aria-live="polite">{week[0]} ~ {week[6]}</span>
        <button type="button" className="icon-button" aria-label="다음 주" disabled={!isCalendarDate(next)} onClick={() => onSelectWeek(next)}><Icon name="chevron" size={14} /></button>
      </div>
      <ol className="task-week">
        {week.map((day, index) => {
          const due = tasks.filter(task => task.dueDate === day && task.status !== 'submitted').length
          return <li key={day} className={day === today ? 'is-today' : ''} aria-current={day === today ? 'date' : undefined}>
            <span>{weekdays[index]}</span><b>{Number(day.slice(-2))}</b>
            <span className={`week-marker ${due ? 'has-deadline' : ''}`} aria-label={due ? `${day} 미제출 과제 ${due}개` : `${day} 마감 없음`} />
          </li>
        })}
      </ol>
      <button type="button" className="task-week-today" onClick={() => onSelectWeek(today)}>이번 주로 돌아가기</button>
      <p>현재 조회 조건 중 미제출 과제의 마감일을 표시합니다. 주를 바꾸면 목록과 집계도 함께 바뀝니다.</p>
    </section>
  )
}
