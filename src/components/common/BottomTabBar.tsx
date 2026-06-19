import { NavLink } from 'react-router-dom'
import { CalendarBlank, ChartBar, Notebook, User } from '@phosphor-icons/react'
import styles from './BottomTabBar.module.css'

const TABS = [
  { to: '/', icon: CalendarBlank, label: '캘린더', end: true },
  { to: '/stats', icon: ChartBar, label: '통계', end: false },
  { to: '/memo', icon: Notebook, label: '메모', end: false },
  { to: '/profile', icon: User, label: '프로필', end: false },
]

export function BottomTabBar() {
  return (
    <nav className={styles.tabBar}>
      {TABS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          <Icon size={26} weight="regular" />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
