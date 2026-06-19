import { CaretLeft, CaretRight, Check } from '@phosphor-icons/react'
import { getWeekDays, formatWeekRange, toDateStr } from '../../lib/dates'
import type { StudyLog, GroupMember } from '../../types'
import styles from './WeeklyCalendar.module.css'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  viewDate: Date
  onPrev: () => void
  onNext: () => void
  logs: StudyLog[]
  members: GroupMember[]
}

export function WeeklyCalendar({ viewDate, onPrev, onNext, logs, members }: Props) {
  const days = getWeekDays(viewDate)
  const todayStr = toDateStr(new Date())
  const todayIdx = days.findIndex((d) => toDateStr(d) === todayStr)

  return (
    <div className={styles.card}>
      <div className={styles.nav}>
        <button onClick={onPrev} className={styles.navBtn}><CaretLeft size={18} weight="bold" /></button>
        <span className={styles.title}>{formatWeekRange(viewDate)}</span>
        <button onClick={onNext} className={styles.navBtn}><CaretRight size={18} weight="bold" /></button>
      </div>

      <div className={styles.tableWrapper}><div className={styles.table}>
        {/* 컬럼 헤더 (빈 셀 + 요일) */}
        <div className={styles.row}>
          <div className={styles.memberCell} />
          {days.map((_d, i) => (
            <div
              key={i}
              className={`${styles.colHeader} ${i === todayIdx ? styles.todayCol : ''}`}
            >
              {DAY_LABELS[i]}
            </div>
          ))}
        </div>

        {/* 멤버별 행 */}
        {members.map((member) => (
          <div key={member.user_id} className={styles.row}>
            <div className={styles.memberCell}>
              <div
                className={styles.avatar}
                style={{ background: member.color }}
              >
                {(member.users as { nickname?: string; icon?: string })?.icon ||
                  (member.users as { nickname?: string })?.nickname?.charAt(0) || '?'}
              </div>
              <span className={styles.memberName}>
                {(member.users as { nickname?: string })?.nickname?.slice(0, 3) || '..'}
              </span>
            </div>
            {days.map((d, i) => {
              const dateStr = toDateStr(d)
              const isDone = logs.some(
                (l) => l.user_id === member.user_id && l.date === dateStr && l.is_done
              )
              const isToday = i === todayIdx
              return (
                <div
                  key={i}
                  className={`${styles.cell} ${isDone ? styles.done : ''} ${isToday && !isDone ? styles.todayCell : ''}`}
                >
                  {isDone && <Check size={14} weight="bold" color="#fff" />}
                </div>
              )
            })}
          </div>
        ))}
      </div></div>
    </div>
  )
}
