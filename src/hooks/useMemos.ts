import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Memo } from '../types'

export function useMemos(userId: string | undefined, groupIds?: string[]) {
  const [memos, setMemos] = useState<Memo[]>([])

  const fetchMemos = useCallback(async () => {
    if (!userId) return
    let query = supabase
      .from('memos')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (groupIds && groupIds.length > 0) {
      query = query.in('group_id', groupIds)
    }

    const { data } = await query
    setMemos((data as Memo[]) || [])
  }, [userId, groupIds?.join(',')])

  const saveMemo = useCallback(async (groupId: string, date: string, content: string) => {
    if (!userId) return
    const existing = memos.find(
      (m) => m.group_id === groupId && m.date === date && m.user_id === userId
    )

    if (existing) {
      if (!content.trim()) {
        await supabase.from('memos').delete().eq('id', existing.id)
        setMemos((prev) => prev.filter((m) => m.id !== existing.id))
      } else {
        const { data } = await supabase
          .from('memos')
          .update({ content })
          .eq('id', existing.id)
          .select()
          .single()
        setMemos((prev) => prev.map((m) => (m.id === existing.id ? (data as Memo) : m)))
      }
    } else if (content.trim()) {
      const { data } = await supabase
        .from('memos')
        .insert({ user_id: userId, group_id: groupId, date, content })
        .select()
        .single()
      setMemos((prev) => [data as Memo, ...prev])
    }
  }, [userId, memos])

  const getMemoForDate = useCallback((groupId: string, date: string) => {
    return memos.find((m) => m.group_id === groupId && m.date === date)
  }, [memos])

  const deleteMemo = useCallback(async (memoId: string) => {
    await supabase.from('memos').delete().eq('id', memoId)
    setMemos((prev) => prev.filter((m) => m.id !== memoId))
  }, [])

  useEffect(() => {
    fetchMemos()
  }, [fetchMemos])

  return { memos, fetchMemos, saveMemo, getMemoForDate, deleteMemo }
}
