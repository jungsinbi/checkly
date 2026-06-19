import { Plus } from '@phosphor-icons/react'
import styles from './GroupTabBar.module.css'
import type { Group } from '../../types'

interface Props {
  groups: Group[]
  activeGroupId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
}

export function GroupTabBar({ groups, activeGroupId, onSelect, onAdd }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        {groups.map((g) => (
          <button
            key={g.id}
            className={`${styles.groupBtn} ${activeGroupId === g.id ? styles.active : ''}`}
            onClick={() => onSelect(g.id)}
            title={g.name}
          >
            <span className={styles.emoji}>{g.icon || '📚'}</span>
          </button>
        ))}
        <button className={styles.addBtn} onClick={onAdd} title="그룹 추가">
          <Plus size={22} weight="bold" />
        </button>
      </div>
    </div>
  )
}
