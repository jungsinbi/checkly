import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, Copy } from '@phosphor-icons/react'
import { EMOJI_LIST } from '../types'
import type { User, Group } from '../types'
import styles from './GroupNewPage.module.css'

interface Props {
  user: User
  createGroup: (name: string, icon: string, goal: number, userId: string) => Promise<Group>
}

type Step = 'name' | 'icon' | 'goal' | 'done'

export function GroupNewPage({ user, createGroup }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📚')
  const [goal, setGoal] = useState(5)
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const group = await createGroup(name.trim(), icon, goal, user.id)
      setCreatedGroup(group)
      setStep('done')
    } catch {
      alert('그룹 생성 중 오류가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done' && createdGroup) {
    return (
      <div className={styles.page}>
        <div className={styles.doneContent}>
          <div className={styles.doneIcon}>{icon}</div>
          <h2 className={styles.doneTitle}>그룹이 만들어졌어요! 🎉</h2>
          <p className={styles.doneDesc}>{name}</p>
          <div className={styles.codeBox}>
            <p className={styles.codeLabel}>초대코드</p>
            <p className={styles.code}>{createdGroup.invite_code}</p>
            <button className={styles.copyBtn} onClick={() => {
              navigator.clipboard.writeText(createdGroup.invite_code)
              alert('초대코드가 복사되었어요!')
            }}>
              <Copy size={18} /> 복사하기
            </button>
          </div>
          <p className={styles.codeHint}>이 코드를 친구에게 공유해주세요</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => navigate('/')}>
          캘린더로 이동
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => step === 'name' ? navigate(-1) : setStep(step === 'icon' ? 'name' : step === 'goal' ? 'icon' : 'goal')}>
          <CaretLeft size={24} weight="bold" />
        </button>
        <div className={styles.stepIndicator}>
          {(['name', 'icon', 'goal'] as Step[]).map((s, i) => (
            <div key={s} className={`${styles.stepDot} ${step === s ? styles.stepDotActive : i < ['name', 'icon', 'goal'].indexOf(step) ? styles.stepDotDone : ''}`} />
          ))}
        </div>
      </header>

      {step === 'name' && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>그룹 이름을 정해주세요</h2>
          <p className={styles.stepDesc}>친구들과 함께할 습관 그룹의 이름이에요</p>
          <input
            className={styles.input}
            placeholder="예: 영어 공부 모임"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <button className={styles.nextBtn} onClick={() => setStep('icon')} disabled={!name.trim()}>
            다음
          </button>
        </div>
      )}

      {step === 'icon' && (
        <div className={styles.stepContent}>
          <div className={styles.selectedIcon}>{icon}</div>
          <h2 className={styles.stepTitle}>그룹 아이콘 선택</h2>
          <p className={styles.stepDesc}>그룹을 표현하는 아이콘을 골라주세요</p>
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
          <button className={styles.nextBtn} onClick={() => setStep('goal')}>
            다음
          </button>
        </div>
      )}

      {step === 'goal' && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>주간 목표 횟수</h2>
          <p className={styles.stepDesc}>일주일에 몇 번 달성할 목표인가요?</p>
          <div className={styles.goalSelector}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                className={`${styles.goalBtn} ${goal === n ? styles.goalSelected : ''}`}
                onClick={() => setGoal(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className={styles.goalHint}>주 {goal}회 달성 목표</p>
          <button className={styles.nextBtn} onClick={handleCreate} disabled={loading}>
            {loading ? '생성 중...' : '그룹 만들기'}
          </button>
        </div>
      )}
    </div>
  )
}
