import styles from './StatCard.module.css'

interface Props {
  label: string
  value: number | string
  unit?: string
}

export function StatCard({ label, value, unit }: Props) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  )
}
