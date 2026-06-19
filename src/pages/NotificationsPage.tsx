import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import styles from './NotificationsPage.module.css'

export function NotificationsPage() {
  const navigate = useNavigate()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [studyReminder, setStudyReminder] = useState(true)
  const [groupActivity, setGroupActivity] = useState(true)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <CaretLeft size={24} />
        </button>
        <h1 className={styles.title}>알림</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.section}>
          <p className={styles.sectionTitle}>알림 설정</p>

          <div className={styles.settingCard}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <p className={styles.settingLabel}>푸시 알림</p>
                <p className={styles.settingDesc}>모든 알림을 받습니다</p>
              </div>
              <button
                className={`${styles.toggle} ${pushEnabled ? styles.toggleOn : ''}`}
                onClick={() => setPushEnabled((v) => !v)}
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <p className={styles.settingLabel}>공부 리마인더</p>
                <p className={styles.settingDesc}>오늘 공부를 아직 하지 않았을 때</p>
              </div>
              <button
                className={`${styles.toggle} ${studyReminder ? styles.toggleOn : ''}`}
                onClick={() => setStudyReminder((v) => !v)}
                disabled={!pushEnabled}
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <p className={styles.settingLabel}>그룹 활동</p>
                <p className={styles.settingDesc}>그룹원이 공부를 완료했을 때</p>
              </div>
              <button
                className={`${styles.toggle} ${groupActivity ? styles.toggleOn : ''}`}
                onClick={() => setGroupActivity((v) => !v)}
                disabled={!pushEnabled}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>최근 알림</p>
          <div className={styles.emptyNotice}>
            <p className={styles.emptyText}>아직 알림이 없어요</p>
          </div>
        </div>
      </div>
    </div>
  )
}
