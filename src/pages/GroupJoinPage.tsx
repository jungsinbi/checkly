import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import type { User, Group } from '../types'
import styles from './GroupJoinPage.module.css'

interface Props {
  user: User
  getGroupByInviteCode: (code: string) => Promise<Group | null>
  joinGroup: (code: string, goal: number, userId: string) => Promise<Group>
}

export function GroupJoinPage({ user, getGroupByInviteCode, joinGroup }: Props) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<Group | null>(null)
  const [goal, setGoal] = useState(5)
  const [step, setStep] = useState<'code' | 'preview' | 'goal'>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch() {
    if (code.length < 6) return
    setLoading(true)
    setError('')
    try {
      const group = await getGroupByInviteCode(code)
      if (!group) { setError('유효하지 않은 초대코드입니다'); return }
      setPreview(group)
      setStep('preview')
    } catch {
      setError('코드를 확인할 수 없어요')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!preview) return
    setLoading(true)
    try {
      await joinGroup(code, goal, user.id)
      navigate('/')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '참여 중 오류가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => step === 'code' ? navigate(-1) : setStep('code')}>
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className={styles.title}>그룹 참여</h1>
        <div style={{ width: 32 }} />
      </header>

      <div className={styles.content}>
        {step === 'code' && (
          <>
            <div className={styles.section}>
              <p className={styles.label}>초대코드 6자리를 입력해주세요</p>
              <input
                className={styles.codeInput}
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
            </div>
            <button
              className={styles.primaryBtn}
              onClick={handleSearch}
              disabled={code.length < 6 || loading}
            >
              {loading ? '확인 중...' : '코드 확인'}
            </button>
          </>
        )}

        {step === 'preview' && preview && (
          <>
            <div className={styles.previewCard}>
              <div className={styles.previewIcon}>{preview.icon || '📚'}</div>
              <h2 className={styles.previewName}>{preview.name}</h2>
              <p className={styles.previewCode}>초대코드: {preview.invite_code}</p>
            </div>

            <div className={styles.section}>
              <p className={styles.label}>주간 목표 횟수를 설정해주세요</p>
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
            </div>

            <button className={styles.primaryBtn} onClick={handleJoin} disabled={loading}>
              {loading ? '참여 중...' : '그룹 참여하기 🎉'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
