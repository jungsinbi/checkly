import styles from './WeeklyGoalDots.module.css'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  goal: number
  doneDays: boolean[]
  todayIndex: number
}

export function WeeklyGoalDots({ doneDays, todayIndex }: Props) {
  return (
    <div className={styles.row}>
      {DAY_LABELS.map((label, i) => {
        const isDone = doneDays[i]
        const isToday = i === todayIndex
        return (
          <div
            key={i}
            className={`${styles.dot} ${isDone ? styles.done : ''} ${isToday && !isDone ? styles.today : ''}`}
          >
            {label}
          </div>
        )
      })}
    </div>
  )
}
