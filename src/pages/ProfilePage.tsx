import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, SignOut, Trash } from '@phosphor-icons/react'
import { useGroups } from '../hooks/useGroups'
import { useUser } from '../hooks/useUser'
import { EMOJI_LIST } from '../types'
import type { User } from '../types'
import styles from './ProfilePage.module.css'

interface Props {
  user: User
  onUserUpdate: (u: User) => void
  onLogout: () => void
}

export function ProfilePage({ user, onUserUpdate, onLogout }: Props) {
  const navigate = useNavigate()
  const { updateUser, deleteAccount } = useUser()
  const { groups, members, fetchMembers, deleteGroup, kickMember, leaveGroup, updateWeeklyGoal, regenerateInviteCode } = useGroups(user.id)

  const [editMode, setEditMode] = useState(false)
  const [nickname, setNickname] = useState(user.nickname)
  const [icon, setIcon] = useState(user.icon || '😊')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [goalEdit, setGoalEdit] = useState<{ groupId: string; value: string } | null>(null)

  async function handleSaveProfile() {
    await updateUser({ nickname, icon })
    onUserUpdate({ ...user, nickname, icon })
    setEditMode(false)
  }

  async function handleDeleteAccount() {
    if (!confirm('정말 계정을 삭제하시겠어요? 모든 데이터가 삭제됩니다.')) return
    await deleteAccount()
    onLogout()
  }

  async function handleCopyCode(code: string) {
    await navigator.clipboard.writeText(code)
    alert('초대코드가 복사되었어요!')
  }

  async function handleRegenerateCode(groupId: string) {
    const code = await regenerateInviteCode(groupId)
    alert(`새 초대코드: ${code}`)
  }

  async function handleExpandGroup(groupId: string) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null)
    } else {
      setExpandedGroup(groupId)
      await fetchMembers(groupId)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>프로필</h1>
      </header>

      <div className={styles.content}>
        {/* 내 정보 */}
        <div className={styles.profileCard}>
          {editMode ? (
            <>
              <button className={styles.avatarBtn} onClick={() => setShowIconPicker(true)}>
                <div className={styles.avatarLg}>{icon}</div>
                <span className={styles.changeIconHint}>탭해서 변경</span>
              </button>
              {showIconPicker && (
                <div className={styles.emojiPicker}>
                  {EMOJI_LIST.map((e) => (
                    <button key={e} className={styles.emojiBtn} onClick={() => { setIcon(e); setShowIconPicker(false) }}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
              <input
                className={styles.nicknameInput}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={12}
              />
              <div className={styles.editBtns}>
                <button className={styles.cancelSmBtn} onClick={() => setEditMode(false)}>취소</button>
                <button className={styles.saveSmBtn} onClick={handleSaveProfile}>저장</button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.avatarLg}>{user.icon || '😊'}</div>
              <p className={styles.nickname}>{user.nickname}</p>
              <button className={styles.editBtn} onClick={() => setEditMode(true)}>수정</button>
            </>
          )}
        </div>

        {/* 내 그룹 목록 */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>내 그룹</p>
          {groups.length === 0 ? (
            <div className={styles.emptyGroups}>
              <p className={styles.emptyText}>참여 중인 그룹이 없어요</p>
              <div className={styles.groupBtns}>
                <button className={styles.newGroupBtn} onClick={() => navigate('/group/new')}>그룹 만들기</button>
                <button className={styles.joinGroupBtn} onClick={() => navigate('/group/join')}>초대코드로 참여</button>
              </div>
            </div>
          ) : (
            groups.map((g) => {
              const isOwner = g.owner_id === user.id
              const myMember = (members[g.id] || []).find((m) => m.user_id === user.id)
              const isExpanded = expandedGroup === g.id
              return (
                <div key={g.id} className={styles.groupCard}>
                  <div className={styles.groupCardHeader} onClick={() => handleExpandGroup(g.id)}>
                    <div className={styles.groupIconWrap}>
                      <span className={styles.groupEmoji}>{g.icon || '📚'}</span>
                    </div>
                    <div className={styles.groupMeta}>
                      <p className={styles.groupName}>{g.name}</p>
                      <p className={styles.groupSub}>
                        주간 목표 {myMember?.weekly_goal || 5}회
                        {isOwner && ' · 방장'}
                      </p>
                    </div>
                    <div className={styles.groupActions}>
                      <button
                        className={styles.copyBtn}
                        onClick={(e) => { e.stopPropagation(); handleCopyCode(g.invite_code) }}
                        title="초대코드 복사"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.groupDetail}>
                      <p className={styles.inviteCode}>초대코드: <strong>{g.invite_code}</strong></p>

                      {/* 주간 목표 수정 */}
                      {goalEdit?.groupId === g.id ? (
                        <div className={styles.goalEdit}>
                          <span>주간 목표</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={goalEdit.value}
                            onChange={(e) => setGoalEdit({ groupId: g.id, value: e.target.value.replace(/[^0-9]/g, '') })}
                            className={styles.goalInput}
                          />
                          <button className={styles.saveSmBtn} onClick={async () => {
                            const goal = Number(goalEdit.value)
                            if (!Number.isInteger(goal) || goal < 1 || goal > 7) {
                              alert('주간 목표는 1~7 사이로 입력해 주세요')
                              return
                            }
                            await updateWeeklyGoal(g.id, user.id, goal)
                            setGoalEdit(null)
                          }}>저장</button>
                          <button className={styles.cancelSmBtn} onClick={() => setGoalEdit(null)}>취소</button>
                        </div>
                      ) : (
                        <button className={styles.textBtn} onClick={() => setGoalEdit({ groupId: g.id, value: String(myMember?.weekly_goal || 5) })}>
                          주간 목표 변경
                        </button>
                      )}

                      {/* 멤버 목록 (방장용) */}
                      {isOwner && (members[g.id] || []).length > 0 && (
                        <div className={styles.memberList}>
                          <p className={styles.memberListTitle}>멤버</p>
                          {(members[g.id] || []).map((m) => (
                            <div key={m.user_id} className={styles.memberRow}>
                              <div className={styles.memberAvatar} style={{ background: m.color }}>
                                {(m.users as { icon?: string })?.icon || (m.users as { nickname?: string })?.nickname?.charAt(0)}
                              </div>
                              <span className={styles.memberName}>
                                {(m.users as { nickname?: string })?.nickname}
                                {m.user_id === user.id ? ' (나)' : ''}
                              </span>
                              {m.user_id !== user.id && (
                                <button
                                  className={styles.kickBtn}
                                  onClick={() => {
                                    if (confirm(`${(m.users as { nickname?: string })?.nickname}님을 내보낼까요?`))
                                      kickMember(g.id, m.user_id)
                                  }}
                                >내보내기</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 방장 전용 액션 */}
                      {isOwner && (
                        <div className={styles.ownerActions}>
                          <button className={styles.regenBtn} onClick={() => handleRegenerateCode(g.id)}>
                            초대코드 재생성
                          </button>
                          <button className={styles.deleteGroupBtn} onClick={() => {
                            if (confirm('그룹을 삭제하시겠어요?')) deleteGroup(g.id)
                          }}>
                            <Trash size={16} /> 그룹 삭제
                          </button>
                        </div>
                      )}

                      {/* 일반 멤버 나가기 */}
                      {!isOwner && (
                        <button className={styles.leaveBtn} onClick={() => {
                          if (confirm('그룹에서 나가시겠어요?')) leaveGroup(g.id, user.id)
                        }}>
                          <SignOut size={16} /> 그룹 나가기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {groups.length > 0 && (
            <div className={styles.addGroupRow}>
              <button className={styles.addGroupBtn} onClick={() => navigate('/group/new')}>+ 그룹 만들기</button>
              <button className={styles.addGroupBtn} onClick={() => navigate('/group/join')}>+ 초대코드로 참여</button>
            </div>
          )}
        </div>

        {/* 계정 */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>계정</p>
          <button className={styles.dangerBtn} onClick={handleDeleteAccount}>
            <Trash size={18} /> 계정 삭제
          </button>
        </div>
      </div>
    </div>
  )
}
