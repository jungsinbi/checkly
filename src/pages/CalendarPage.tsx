import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Gear, Fire } from '@phosphor-icons/react'
import { GroupTabBar } from '../components/common/GroupTabBar'
import { MonthlyCalendar } from '../components/calendar/MonthlyCalendar'
import { WeeklyCalendar } from '../components/calendar/WeeklyCalendar'
import { CheckButton } from '../components/common/CheckButton'
import { WeeklyGoalDots } from '../components/common/WeeklyGoalDots'
import { MemoSheet } from '../components/common/MemoSheet'
import { useGroups } from '../hooks/useGroups'
import { useStudyLogs } from '../hooks/useStudyLogs'
import { useMemos } from '../hooks/useMemos'
import { toDateStr, getWeekDays, calcStreak } from '../lib/dates'
import type { User } from '../types'
import styles from './CalendarPage.module.css'

interface Props {
  user: User
}

type CalendarMode = 'monthly' | 'weekly'

export function CalendarPage({ user }: Props) {
  const navigate = useNavigate()
  const [calMode, setCalMode] = useState<CalendarMode>('monthly')
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { groups, members, fetchMembers } = useGroups(user.id)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

  const currentGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null
  const currentGroupId = currentGroup?.id

  const { logs, toggleToday, toggleDate } = useStudyLogs(currentGroupId, user.id)
  const { memos, saveMemo, getMemoForDate } = useMemos(user.id, currentGroupId ? [currentGroupId] : [])

  const currentMembers = currentGroupId ? (members[currentGroupId] || []) : []

  // 그룹 선택 시 멤버 로드
  const handleGroupSelect = useCallback((id: string) => {
    setActiveGroupId(id)
    fetchMembers(id)
  }, [fetchMembers])

  // 그룹이 바뀌면 멤버 자동 로드
  const resolvedGroupId = activeGroupId || groups[0]?.id
  if (resolvedGroupId && !members[resolvedGroupId] && groups.length > 0) {
    fetchMembers(resolvedGroupId)
  }

  const todayStr = toDateStr(new Date())
  const today = new Date()
  const todayDayIndex = today.getDay()

  const myTodayLog = logs.find((l) => l.user_id === user.id && l.date === todayStr && l.group_id === currentGroupId)
  const isTodayDone = myTodayLog?.is_done || false

  const myDoneLogs = logs.filter((l) => l.user_id === user.id && l.is_done && l.group_id === currentGroupId)
  const myDoneDates = myDoneLogs.map((l) => l.date)
  const streak = calcStreak(myDoneDates)

  const weekDays = getWeekDays(today)
  const weekDoneBools = weekDays.map((d) => myDoneDates.includes(toDateStr(d)))
  const weekDoneCount = weekDoneBools.filter(Boolean).length

  const myMember = currentMembers.find((m) => m.user_id === user.id)
  const weeklyGoal = myMember?.weekly_goal || 5

  // 날짜 네비게이션
  function prevPeriod() {
    const d = new Date(viewDate)
    if (calMode === 'monthly') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setViewDate(d)
  }
  function nextPeriod() {
    const d = new Date(viewDate)
    if (calMode === 'monthly') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setViewDate(d)
  }

  async function handleSheetSave(_done: boolean, memo: string) {
    if (!selectedDate || !currentGroupId) return
    await toggleDate(selectedDate)
    await saveMemo(currentGroupId, selectedDate, memo)
  }

  const selectedMemo = selectedDate && currentGroupId
    ? getMemoForDate(currentGroupId, selectedDate)
    : null

  const selectedLog = selectedDate
    ? logs.find((l) => l.user_id === user.id && l.date === selectedDate && l.group_id === currentGroupId)
    : null

  const todayDisplay = `${today.getMonth() + 1}월 ${today.getDate()}일`

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1 className={styles.appTitle}>Checkly</h1>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={() => navigate('/notifications')}>
            <Bell size={26} />
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/profile')}>
            <Gear size={26} />
          </button>
        </div>
      </header>

      {/* 그룹 탭바 */}
      <GroupTabBar
        groups={groups}
        activeGroupId={resolvedGroupId || null}
        onSelect={handleGroupSelect}
        onAdd={() => navigate('/group/new')}
      />

      <div className={styles.content}>
        {!currentGroup ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>아직 참여 중인 그룹이 없어요</p>
            <p className={styles.emptyDesc}>그룹을 만들거나 초대코드로 참여해보세요!</p>
            <div className={styles.emptyActions}>
              <button className={styles.primaryBtn} onClick={() => navigate('/group/new')}>
                그룹 만들기
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate('/group/join')}>
                초대코드로 참여
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 월별/주간 토글 */}
            <div className={styles.toggleWrapper}>
              <div className={styles.toggle}>
                <button
                  className={`${styles.toggleBtn} ${calMode === 'monthly' ? styles.toggleActive : ''}`}
                  onClick={() => setCalMode('monthly')}
                >월별</button>
                <button
                  className={`${styles.toggleBtn} ${calMode === 'weekly' ? styles.toggleActive : ''}`}
                  onClick={() => setCalMode('weekly')}
                >주간</button>
              </div>
            </div>

            {/* 캘린더 */}
            {calMode === 'monthly' ? (
              <MonthlyCalendar
                viewDate={viewDate}
                onPrev={prevPeriod}
                onNext={nextPeriod}
                logs={logs}
                members={currentMembers}
                memos={memos}
                userId={user.id}
                onDateClick={setSelectedDate}
              />
            ) : (
              <WeeklyCalendar
                viewDate={viewDate}
                onPrev={prevPeriod}
                onNext={nextPeriod}
                logs={logs}
                members={currentMembers}
              />
            )}

            {/* 오늘 체크 카드 */}
            <div className={styles.todayCard}>
              <div className={styles.todayInfo}>
                <p className={styles.todayDate}>오늘 {todayDisplay}</p>
                <p className={styles.todayStatus}>
                  {isTodayDone ? '미션 성공했어요!' : '아직 체크 전이에요'}
                </p>
                {streak > 0 && (
                  <p className={styles.streak}>
                    <Fire size={16} weight="fill" color="#FF6B35" /> {streak}일 연속 달성 중
                  </p>
                )}
              </div>
              <CheckButton isDone={isTodayDone} onToggle={toggleToday} />
            </div>

            {/* 주간 목표 카드 */}
            <div className={styles.goalCard}>
              <p className={styles.goalTitle}>
                이번 주 목표 <strong>{weeklyGoal}회</strong> 중 <strong>{weekDoneCount}회</strong> 완료
              </p>
              <WeeklyGoalDots
                goal={weeklyGoal}
                doneDays={weekDoneBools}
                todayIndex={todayDayIndex}
              />
            </div>
          </>
        )}
      </div>

      {/* 날짜 모달 */}
      {selectedDate && currentGroupId && (
        <MemoSheet
          date={selectedDate}
          groupName={currentGroup?.name}
          initialDone={selectedLog?.is_done || false}
          initialMemo={selectedMemo?.content || ''}
          onSave={handleSheetSave}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
