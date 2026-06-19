import { useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { CheckButton } from './CheckButton'
import styles from './MemoSheet.module.css'

interface Props {
  date: string
  groupName?: string
  initialDone: boolean
  initialMemo: string
  onSave: (done: boolean, memo: string) => void
  onClose: () => void
}

export function MemoSheet({ date, groupName, initialDone, initialMemo, onSave, onClose }: Props) {
  const [isDone, setIsDone] = useState(initialDone)
  const [memo, setMemo] = useState(initialMemo)
  const overlayRef = useRef<HTMLDivElement>(null)

  const displayDate = new Date(date + 'T00:00:00')
  const formatted = `${displayDate.getMonth() + 1}월 ${displayDate.getDate()}일`

  function handleSave() {
    onSave(isDone, memo)
    onClose()
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <div>
            <p className={styles.dateLabel}>{formatted}</p>
            {groupName && <p className={styles.groupName}>{groupName}</p>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className={styles.checkRow}>
          <div>
            <p className={styles.checkLabel}>{isDone ? '미션 성공했어요! ✅' : '아직 체크 전이에요'}</p>
          </div>
          <CheckButton isDone={isDone} onToggle={() => setIsDone(!isDone)} />
        </div>

        <div className={styles.memoSection}>
          <label className={styles.memoLabel}>메모 <span className={styles.private}>나만 볼 수 있어요</span></label>
          <textarea
            className={styles.textarea}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder=""
            rows={4}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>닫기</button>
          <button className={styles.saveBtn} onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  )
}
