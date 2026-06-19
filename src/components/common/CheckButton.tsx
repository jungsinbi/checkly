import { Check } from '@phosphor-icons/react'
import styles from './CheckButton.module.css'

interface Props {
  isDone: boolean
  onToggle: () => void
  size?: number
}

export function CheckButton({ isDone, onToggle, size = 64 }: Props) {
  return (
    <button
      className={`${styles.btn} ${isDone ? styles.done : ''}`}
      onClick={onToggle}
      style={{ width: size, height: size }}
      aria-label={isDone ? '체크 취소' : '체크 완료'}
    >
      <Check
        size={size * 0.5}
        weight="bold"
        color={isDone ? '#fff' : '#6EBFA8'}
      />
    </button>
  )
}
