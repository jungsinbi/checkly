import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toDateStr, today } from '../lib/dates'
import type { StudyLog } from '../types'

// 여러 그룹에 걸친 내 기록 (통계의 「전체 그룹 이번 주」용)
export function useMyLogs(userId: string | undefined, groupIds: string[]) {
  const [logs, setLogs] = useState<StudyLog[]>([])
  const groupKey = groupIds.join(',')

  useEffect(() => {
    if (!userId || groupIds.length === 0) return
    supabase
      .from('study_logs')
      .select('*')
      .eq('user_id', userId)
      .in('group_id', groupIds)
      .then(({ data }) => setLogs((data as StudyLog[]) || []))
  }, [userId, groupKey])

  return logs
}

export function useStudyLogs(groupId: string | undefined, userId: string | undefined) {
  const [logs, setLogs] = useState<StudyLog[]>([])
  const [loading, setLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('study_logs')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false })
      setLogs((data as StudyLog[]) || [])
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const toggleToday = useCallback(async () => {
    if (!groupId || !userId) return
    const dateStr = toDateStr(today())
    const existing = logs.find(
      (l) => l.user_id === userId && l.date === dateStr && l.group_id === groupId
    )

    if (existing) {
      const newDone = !existing.is_done
      const { data } = await supabase
        .from('study_logs')
        .update({ is_done: newDone })
        .eq('id', existing.id)
        .select()
        .single()
      setLogs((prev) => prev.map((l) => (l.id === existing.id ? (data as StudyLog) : l)))
    } else {
      const { data } = await supabase
        .from('study_logs')
        .insert({ user_id: userId, group_id: groupId, date: dateStr, is_done: true })
        .select()
        .single()
      setLogs((prev) => [data as StudyLog, ...prev])
    }
  }, [groupId, userId, logs])

  const toggleDate = useCallback(async (date: string) => {
    if (!groupId || !userId) return
    const existing = logs.find(
      (l) => l.user_id === userId && l.date === date && l.group_id === groupId
    )

    if (existing) {
      const newDone = !existing.is_done
      const { data } = await supabase
        .from('study_logs')
        .update({ is_done: newDone })
        .eq('id', existing.id)
        .select()
        .single()
      setLogs((prev) => prev.map((l) => (l.id === existing.id ? (data as StudyLog) : l)))
    } else {
      const { data } = await supabase
        .from('study_logs')
        .insert({ user_id: userId, group_id: groupId, date, is_done: true })
        .select()
        .single()
      setLogs((prev) => [data as StudyLog, ...prev])
    }
  }, [groupId, userId, logs])

  // Realtime 구독
  useEffect(() => {
    if (!groupId) return

    fetchLogs()

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_logs', filter: `group_id=eq.${groupId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLogs((prev) => {
              const exists = prev.find((l) => l.id === (payload.new as StudyLog).id)
              if (exists) return prev
              return [payload.new as StudyLog, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setLogs((prev) =>
              prev.map((l) => (l.id === (payload.new as StudyLog).id ? (payload.new as StudyLog) : l))
            )
          } else if (payload.eventType === 'DELETE') {
            setLogs((prev) => prev.filter((l) => l.id !== (payload.old as StudyLog).id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [groupId, fetchLogs])

  return { logs, loading, fetchLogs, toggleToday, toggleDate }
}
