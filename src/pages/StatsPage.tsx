import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { StatCard } from '../components/common/StatCard'
import { useGroups } from '../hooks/useGroups'
import { useStudyLogs } from '../hooks/useStudyLogs'
import { toDateStr, getWeekDays, calcStreak, calcMaxStreak } from '../lib/dates'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import type { User } from '../types'
import styles from './StatsPage.module.css'

interface Props {
  user: User
}

type StatsTab = 'my' | 'group'
type ChartPeriod = 'weekly' | 'monthly'

export function StatsPage({ user }: Props) {
  const [statsTab, setStatsTab] = useState<StatsTab>('my')
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('weekly')
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

  const { groups, members, fetchMembers } = useGroups(user.id)
  const currentGroupId = activeGroupId || groups[0]?.id
  const { logs } = useStudyLogs(currentGroupId, user.id)
  const currentMembers = currentGroupId ? (members[currentGroupId] || []) : []

  useEffect(() => {
    if (currentGroupId) fetchMembers(currentGroupId)
  }, [currentGroupId])

  const today = new Date()
  const todayStr = toDateStr(today)

  const myLogs = logs.filter((l) => l.user_id === user.id && l.is_done)
  const myDoneDates = myLogs.map((l) => l.date)

  const streak = calcStreak(myDoneDates)
  const maxStreak = calcMaxStreak(myDoneDates)
  const totalDays = myDoneDates.length

  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const doneDaysThisMonth = monthDays.filter((d) => myDoneDates.includes(toDateStr(d))).length
  const monthRate = Math.round((doneDaysThisMonth / monthDays.length) * 100)

  const myMember = currentMembers.find((m) => m.user_id === user.id)
  const weeklyGoal = myMember?.weekly_goal || 5
  const weekDays = getWeekDays(today)
  const weekDoneCount = weekDays.filter((d) => myDoneDates.includes(toDateStr(d))).length

  // 주간 차트 데이터 (최근 8주)
  const weeklyChartData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(today, 7 - i), { weekStartsOn: 0 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const done = days.filter((d) => myDoneDates.includes(toDateStr(d))).length
    return {
      label: format(weekStart, 'M/d'),
      value: Math.round((done / 7) * 100),
    }
  })

  // 월별 차트 데이터 (최근 6개월)
  const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today)
    d.setMonth(d.getMonth() - (5 - i))
    const mStart = startOfMonth(d)
    const mEnd = endOfMonth(d)
    const days = eachDayOfInterval({ start: mStart, end: mEnd })
    const done = days.filter((day) => myDoneDates.includes(toDateStr(day))).length
    return {
      label: format(mStart, 'M월'),
      value: Math.round((done / days.length) * 100),
    }
  })

  const chartData = chartPeriod === 'weekly' ? weeklyChartData : monthlyChartData

  // 그룹 통계
  const todayLogUsers = logs.filter((l) => l.date === todayStr && l.is_done).map((l) => l.user_id)
  const groupTodayCount = new Set(todayLogUsers).size
  const allMemberCount = currentMembers.length
  const groupWeekDays = getWeekDays(today)
  const groupWeekDone = groupWeekDays.reduce((acc, d) => {
    const dstr = toDateStr(d)
    const done = logs.filter((l) => l.date === dstr && l.is_done).length
    return acc + done
  }, 0)
  const groupWeekTotal = groupWeekDays.length * allMemberCount
  const groupWeekRate = groupWeekTotal > 0 ? Math.round((groupWeekDone / groupWeekTotal) * 100) : 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>통계</h1>
      </header>

      {/* 그룹 선택 */}
      {groups.length > 1 && (
        <div className={styles.groupPicker}>
          {groups.map((g) => (
            <button
              key={g.id}
              className={`${styles.groupBtn} ${(activeGroupId || groups[0]?.id) === g.id ? styles.groupActive : ''}`}
              onClick={() => { setActiveGroupId(g.id); fetchMembers(g.id) }}
            >
              {g.icon} {g.name}
            </button>
          ))}
        </div>
      )}

      {/* 내/그룹 탭 */}
      <div className={styles.tabRow}>
        <button
          className={`${styles.tab} ${statsTab === 'my' ? styles.tabActive : ''}`}
          onClick={() => setStatsTab('my')}
        >내 통계</button>
        <button
          className={`${styles.tab} ${statsTab === 'group' ? styles.tabActive : ''}`}
          onClick={() => setStatsTab('group')}
        >그룹 통계</button>
      </div>

      <div className={styles.content}>
        {statsTab === 'my' ? (
          <>
            {/* 요약 카드 2×2 */}
            <div className={styles.statsGrid}>
              <StatCard label="이번 달 달성률" value={monthRate} unit="%" />
              <StatCard label="현재 스트릭" value={streak} unit="일" />
              <StatCard label="최장 스트릭" value={maxStreak} unit="일" />
              <StatCard label="총 달성일" value={totalDays} unit="일" />
            </div>

            {/* 목표 대비 */}
            <div className={styles.goalSection}>
              <p className={styles.goalLabel}>이번 주 목표 {weeklyGoal}회 중 {weekDoneCount}회</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.min((weekDoneCount / weeklyGoal) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* 차트 */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <p className={styles.chartTitle}>달성률 추이</p>
                <div className={styles.periodToggle}>
                  <button
                    className={`${styles.periodBtn} ${chartPeriod === 'weekly' ? styles.periodActive : ''}`}
                    onClick={() => setChartPeriod('weekly')}
                  >주간</button>
                  <button
                    className={`${styles.periodBtn} ${chartPeriod === 'monthly' ? styles.periodActive : ''}`}
                    onClick={() => setChartPeriod('monthly')}
                  >월별</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 13, fontFamily: 'Nunito', fill: '#555555' }} />
                  <YAxis tick={{ fontSize: 13, fontFamily: 'Nunito', fill: '#555555' }} domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, '달성률']} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#7B6BBF" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 전체 그룹 주간 그리드 */}
            {groups.length > 0 && (
              <div className={styles.allGroupsGrid}>
                <p className={styles.sectionLabel}>전체 그룹 이번 주</p>
                {groups.map((g) => {
                  const gLogs = logs.filter((l) => l.group_id === g.id && l.user_id === user.id && l.is_done)
                  const gDates = gLogs.map((l) => l.date)
                  const gDoneDays = weekDays.map((d) => gDates.includes(toDateStr(d)))
                  return (
                    <div key={g.id} className={styles.groupRow}>
                      <span className={styles.groupLabel}>{g.icon} {g.name}</span>
                      <div className={styles.miniDots}>
                        {gDoneDays.map((done, i) => (
                          <div key={i} className={`${styles.miniDot} ${done ? styles.miniDone : ''}`} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <StatCard label="그룹 전체 달성률" value={groupWeekRate} unit="%" />
              <StatCard label="오늘 체크한 멤버" value={`${groupTodayCount}/${allMemberCount}`} unit="명" />
            </div>

            {/* 멤버별 주간 그리드 */}
            <div className={styles.chartCard}>
              <p className={styles.chartTitle}>멤버별 이번 주</p>
              <div className={styles.memberGrid}>
                {currentMembers.map((m) => {
                  const mDates = logs.filter((l) => l.user_id === m.user_id && l.is_done).map((l) => l.date)
                  const mDone = weekDays.map((d) => mDates.includes(toDateStr(d)))
                  return (
                    <div key={m.user_id} className={styles.memberGridRow}>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberAvatar} style={{ background: m.color }}>
                          {(m.users as { icon?: string })?.icon || (m.users as { nickname?: string })?.nickname?.charAt(0) || '?'}
                        </div>
                        <span className={styles.memberGridName}>
                          {(m.users as { nickname?: string })?.nickname?.slice(0, 5) || '..'}
                        </span>
                      </div>
                      <div className={styles.miniDots}>
                        {mDone.map((done, i) => (
                          <div key={i} className={`${styles.miniDot} ${done ? styles.miniDone : ''}`}
                            style={done ? { background: m.color } : {}} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 멤버별 달성률 가로 차트 */}
            <div className={styles.chartCard}>
              <p className={styles.chartTitle}>멤버별 달성률 (이번 주)</p>
              <div className={styles.memberBars}>
                {currentMembers.map((m) => {
                  const mDates = logs.filter((l) => l.user_id === m.user_id && l.is_done).map((l) => l.date)
                  const done = weekDays.filter((d) => mDates.includes(toDateStr(d))).length
                  const rate = Math.round((done / 7) * 100)
                  return (
                    <div key={m.user_id} className={styles.memberBarRow}>
                      <span className={styles.memberBarName}>
                        {(m.users as { nickname?: string })?.nickname?.slice(0, 6) || '..'}
                      </span>
                      <div className={styles.memberBarTrack}>
                        <div className={styles.memberBarFill} style={{ width: `${rate}%`, background: m.color }} />
                      </div>
                      <span className={styles.memberBarVal}>{rate}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
