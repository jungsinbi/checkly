import { useState } from 'react'
import { EMOJI_LIST } from '../types'
import type { User } from '../types'
import styles from './OnboardingPage.module.css'

interface Props {
  onComplete: (user: User) => void
  createUser: (nickname: string, icon: string) => Promise<User>
}

type Step = 'splash' | 'nickname' | 'icon' | 'done'

export function OnboardingPage({ onComplete, createUser }: Props) {
  const [step, setStep] = useState<Step>('splash')
  const [nickname, setNickname] = useState('')
  const [icon, setIcon] = useState('📚')
  const [loading, setLoading] = useState(false)

  // splash 자동 전환
  if (step === 'splash') {
    setTimeout(() => setStep('nickname'), 1800)
  }

  async function handleComplete() {
    if (!nickname.trim()) return
    setLoading(true)
    try {
      const user = await createUser(nickname.trim(), icon)
      onComplete(user)
    } catch (e) {
      alert('오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'splash') {
    return (
      <div className={styles.splash}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✅</span>
          <h1 className={styles.logoTitle}>Checkly</h1>
        </div>
        <p className={styles.logoSub}>함께 만드는 습관</p>
      </div>
    )
  }

  if (step === 'nickname') {
    return (
      <div className={styles.page}>
        <div className={styles.stepContent}>
          <div className={styles.stepEmoji}>👋</div>
          <h2 className={styles.stepTitle}>반가워요!</h2>
          <p className={styles.stepDesc}>어떻게 불러드릴까요?</p>
          <input
            className={styles.input}
            placeholder="닉네임을 입력해주세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={12}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && setStep('icon')}
          />
          <p className={styles.hint}>최대 12자</p>
        </div>
        <button
          className={styles.nextBtn}
          onClick={() => setStep('icon')}
          disabled={!nickname.trim()}
        >
          다음
        </button>
      </div>
    )
  }

  if (step === 'icon') {
    return (
      <div className={styles.page}>
        <div className={styles.stepContent}>
          <div className={styles.selectedIcon}>{icon}</div>
          <h2 className={styles.stepTitle}>프로필 아이콘</h2>
          <p className={styles.stepDesc}>마음에 드는 아이콘을 골라주세요</p>
          <div className={styles.emojiGrid}>
            {EMOJI_LIST.map((e) => (
              <button
                key={e}
                className={`${styles.emojiBtn} ${icon === e ? styles.emojiSelected : ''}`}
                onClick={() => setIcon(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <button
          className={styles.nextBtn}
          onClick={handleComplete}
          disabled={loading}
        >
          {loading ? '...' : '시작하기 🎉'}
        </button>
      </div>
    )
  }

  return null
}
