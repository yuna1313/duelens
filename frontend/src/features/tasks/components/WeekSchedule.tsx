import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { currentWeek, dateLabel, isCalendarDate, offsetDate } from '@/utils/date'
import { adjacentMonth, monthCalendar, scheduleTasks } from '../weekCalendar'
import type { TaskPreview } from '../model'
import './WeekSchedule.css'

const weekdays = ['월', '화', '수', '목', '금', '토', '일']

function WeekPicker({ date, today, onSelect, onClose }: {
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
      <p id={`${prefix}-help`}>날짜가 포함된 월요일~일요일의 일정 미리보기를 변경합니다. 과제 목록의 조회 조건은 유지됩니다.</p>
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

function WeekDayPreview({ today, date, tasks, onCurrentWeek }: {
  today: string; date: string; tasks: TaskPreview[]; onCurrentWeek: () => void
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const previewId = useId()
  const week = currentWeek(date)
  const weekTasks = scheduleTasks(tasks, date)
  const visibleTasks = selectedDay ? scheduleTasks(tasks, date, selectedDay) : weekTasks
  return <>
      <ol className="task-week">
        {week.map((day, index) => {
          const due = weekTasks.filter(task => task.dueDate === day).length
          return <li key={day}>
            <button type="button" className={`task-week-day ${day === today ? 'is-today' : ''} ${day === selectedDay ? 'is-selected' : ''}`}
              aria-label={`${day} ${dateLabel(day)}, 미제출 과제 ${due}개`} aria-current={day === today ? 'date' : undefined}
              aria-pressed={day === selectedDay} aria-controls={previewId} onClick={() => setSelectedDay(previous => previous === day ? null : day)}>
              <span>{weekdays[index]}</span><b>{Number(day.slice(-2))}</b>
              <span className={`week-marker ${due ? 'has-deadline' : ''}`} aria-hidden="true" />
            </button>
          </li>
        })}
      </ol>
      <button type="button" className="task-week-today" onClick={onCurrentWeek}>이번 주로 돌아가기</button>
      <section className="task-day-preview" id={previewId} aria-labelledby={`${previewId}-heading`}>
        <div className="schedule-preview-heading">
          <h3 id={`${previewId}-heading`} aria-live="polite">{selectedDay ? `${dateLabel(selectedDay)} 미제출` : '이 주 미제출'}<span>{visibleTasks.length}개</span></h3>
          <button type="button" aria-pressed={!selectedDay} onClick={() => setSelectedDay(null)}>주 전체</button>
        </div>
        {visibleTasks.length > 0 ? <ul>{visibleTasks.map(task => <li key={task.id}>
          <a href={`#/tasks/${task.id}`}><strong>{task.title}</strong><time dateTime={task.dueTime ? `${task.dueDate}T${task.dueTime}+09:00` : undefined}>{selectedDay ? task.dueTime ? `마감 ${task.dueTime}` : '마감 시각 미정' : `${dateLabel(task.dueDate!)} · ${task.dueTime ?? '시각 미정'}`}</time></a>
        </li>)}</ul> : <p>{selectedDay ? '이날' : '이 주에'} 마감인 미제출 과제가 없습니다.</p>}
      </section>
  </>
}

export function WeekSchedule({ today, tasks }: { today: string; tasks: TaskPreview[] }) {
  const [anchor, setAnchor] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const date = anchor ?? today
  const week = currentWeek(date)
  const previous = offsetDate(date, -7)
  const next = offsetDate(date, 7)
  return (
    <section className={`panel task-week-card ${expanded ? 'is-expanded' : ''}`} aria-label="주간 마감 일정">
      <header>
        <h2>일정 미리보기</h2>
        <button type="button" className="schedule-disclosure" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(value => !value)}><span>일정 미리보기</span><Icon name="chevron" size={14} /></button>
        <button type="button" className="icon-button schedule-picker-trigger" aria-label="달력에서 주 선택" aria-haspopup="dialog" aria-expanded={pickerOpen} title="달력에서 주 선택" onClick={() => setPickerOpen(true)}><Icon name="calendar" size={17} /></button>
      </header>
      <div id={contentId} className="schedule-content">
      <div className="task-week-navigation">
        <button type="button" className="icon-button week-previous" aria-label="이전 주" disabled={!isCalendarDate(previous)} onClick={() => setAnchor(previous)}><Icon name="chevron" size={14} /></button>
        <span aria-live="polite">{week[0]} ~ {week[6]}</span>
        <button type="button" className="icon-button" aria-label="다음 주" disabled={!isCalendarDate(next)} onClick={() => setAnchor(next)}><Icon name="chevron" size={14} /></button>
      </div>
      <WeekDayPreview key={week[0]} today={today} date={date} tasks={tasks} onCurrentWeek={() => setAnchor(null)} />
      <p className="schedule-scope-note">선택한 학기의 미제출 일정입니다. 목록의 기간·검색·필터와 별도로 확인할 수 있어요.</p>
      </div>
      {pickerOpen && <WeekPicker date={date} today={today} onClose={() => setPickerOpen(false)} onSelect={day => { setAnchor(day); setPickerOpen(false) }} />}
    </section>
  )
}
