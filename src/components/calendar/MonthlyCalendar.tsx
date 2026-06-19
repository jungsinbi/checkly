import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { getMonthDays, formatMonthTitle, toDateStr, isSameMonth } from '../../lib/dates'
import type { StudyLog, GroupMember, Memo } from '../../types'
import styles from './MonthlyCalendar.module.css'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  viewDate: Date
  onPrev: () => void
  onNext: () => void
  logs: StudyLog[]
  members: GroupMember[]
  memos: Memo[]
  userId: string
  onDateClick: (date: string) => void
}

export function MonthlyCalendar({ viewDate, onPrev, onNext, logs, members, memos, userId, onDateClick }: Props) {
  const days = getMonthDays(viewDate)
  const todayStr = toDateStr(new Date())

  function getCellData(date: Date) {
    const dateStr = toDateStr(date)
    const dayLogs = logs.filter((l) => l.date === dateStr && l.is_done)
    const doneMemberIds = new Set(dayLogs.map((l) => l.user_id))
    const doneMembers = members.filter((m) => doneMemberIds.has(m.user_id))
    const allDone = members.length > 0 && doneMembers.length === members.length
    const hasMemo = memos.some((m) => m.date === dateStr && m.user_id === userId)
    return { doneMembers, allDone, hasMemo }
  }

  return (
    <div className={styles.card}>
      <div className={styles.nav}>
        <button onClick={onPrev} className={styles.navBtn}><CaretLeft size={18} weight="bold" /></button>
        <span className={styles.title}>{formatMonthTitle(viewDate)}</span>
        <button onClick={onNext} className={styles.navBtn}><CaretRight size={18} weight="bold" /></button>
      </div>

      <div className={styles.dayHeaders}>
        {DAY_HEADERS.map((d) => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((date, i) => {
          const dateStr = toDateStr(date)
          const isCurrentMonth = isSameMonth(date, viewDate)
          const isToday = dateStr === todayStr
          const { doneMembers, allDone, hasMemo } = getCellData(date)
          const dateNumClass = isToday ? styles.today : hasMemo ? styles.memo : ''

          return (
            <div
              key={i}
              className={`${styles.cell} ${!isCurrentMonth ? styles.otherMonth : ''}`}
              onClick={() => isCurrentMonth && onDateClick(dateStr)}
            >
              <div className={`${styles.dateNum} ${isCurrentMonth ? dateNumClass : ''}`}>
                {date.getDate()}
              </div>
              {isCurrentMonth && (
                <div className={styles.dots}>
                  {allDone ? (
                    <span className={styles.starEmoji}>💜</span>
                  ) : (
                    doneMembers.map((m) => (
                      <span
                        key={m.user_id}
                        className={styles.memberDot}
                        style={{ background: m.color }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
