import { CaretLeft, CaretRight, Heart } from '@phosphor-icons/react'
import { getMonthDays, formatMonthTitle, toDateStr, isSameMonth } from '../../lib/dates'
import type { Memo } from '../../types'
import styles from './MonthlyCalendar.module.css'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  viewDate: Date
  onPrev: () => void
  onNext: () => void
  memos: Memo[]
  userId: string
  doneDates: string[]
  onDateClick: (date: string) => void
}

export function MonthlyCalendar({ viewDate, onPrev, onNext, memos, userId, doneDates, onDateClick }: Props) {
  const days = getMonthDays(viewDate)
  const todayStr = toDateStr(new Date())

  function getCellData(date: Date) {
    const dateStr = toDateStr(date)
    const hasMemo = memos.some((m) => m.date === dateStr && m.user_id === userId)
    const isDone = doneDates.includes(dateStr)
    return { hasMemo, isDone }
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
          const { hasMemo, isDone } = getCellData(date)
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
                <div className={styles.mark}>
                  {isDone && <Heart size={14} weight="fill" className={styles.heart} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
