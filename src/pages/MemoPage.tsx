import { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import { useMemos } from '../hooks/useMemos'
import type { User, Memo } from '../types'
import styles from './MemoPage.module.css'

interface Props {
  user: User
}

export function MemoPage({ user }: Props) {
  const { groups } = useGroups(user.id)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [editContent, setEditContent] = useState('')

  const allGroupIds = groups.map((g) => g.id)
  const filterIds = activeGroupId ? [activeGroupId] : allGroupIds

  const { memos, saveMemo, deleteMemo } = useMemos(user.id, filterIds)

  function selectGroup(id: string) {
    setActiveGroupId((prev) => (prev === id ? null : id))
  }

  function openEdit(memo: Memo) {
    setEditingMemo(memo)
    setEditContent(memo.content)
  }

  async function handleSaveEdit() {
    if (!editingMemo) return
    await saveMemo(editingMemo.group_id, editingMemo.date, editContent)
    setEditingMemo(null)
  }

  async function handleDelete(memo: Memo) {
    if (!confirm('메모를 삭제할까요?')) return
    await deleteMemo(memo.id)
  }

  function getGroupInfo(groupId: string) {
    return groups.find((g) => g.id === groupId)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>메모</h1>
      </header>

      {/* 그룹 필터 */}
      {groups.length > 1 && (
        <div className={styles.filters}>
          {groups.map((g) => (
            <button
              key={g.id}
              className={`${styles.filterBtn} ${activeGroupId === g.id ? styles.filterActive : ''}`}
              onClick={() => selectGroup(g.id)}
            >
              {g.icon} {g.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.content}>
        {memos.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>메모가 없어요</p>
            <p className={styles.emptyDesc}>캘린더에서 날짜를 탭해 메모를 작성해보세요</p>
          </div>
        ) : (
          <div className={styles.memoList}>
            {memos.map((memo) => {
              const group = getGroupInfo(memo.group_id)
              return (
                <div key={memo.id} className={styles.memoCard} onClick={() => openEdit(memo)}>
                  <p className={styles.memoDate}>{formatDate(memo.date)}</p>
                  {group && (
                    <p className={styles.memoGroup}>{group.icon} {group.name}</p>
                  )}
                  <p className={styles.memoContent}>{memo.content}</p>
                  <div className={styles.memoActions}>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => { e.stopPropagation(); handleDelete(memo) }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 메모 편집 모달 */}
      {editingMemo && (
        <div className={styles.modalOverlay} onClick={() => setEditingMemo(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <p className={styles.modalDate}>{formatDate(editingMemo.date)}</p>
            <textarea
              className={styles.editTextarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              autoFocus
            />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => setEditingMemo(null)}>취소</button>
              <button className={styles.saveBtn} onClick={handleSaveEdit}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
