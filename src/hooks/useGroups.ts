import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { MEMBER_COLORS } from '../types'
import type { Group, GroupMember } from '../types'

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function useGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<Record<string, GroupMember[]>>({})
  const [loading, setLoading] = useState(false)

  const fetchGroups = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)

      if (!memberRows || memberRows.length === 0) {
        setGroups([])
        return
      }

      const groupIds = memberRows.map((r) => r.group_id as string)
      const { data: groupRows } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: true })

      setGroups((groupRows as Group[]) || [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchMembers = useCallback(async (groupId: string) => {
    const { data } = await supabase
      .from('group_members')
      .select('*, users(id, nickname, icon)')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    setMembers((prev) => ({ ...prev, [groupId]: (data as GroupMember[]) || [] }))
    return (data as GroupMember[]) || []
  }, [])

  const createGroup = useCallback(async (
    name: string,
    icon: string,
    weeklyGoal: number,
    userId: string
  ) => {
    const invite_code = generateInviteCode()
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, icon, invite_code, owner_id: userId })
      .select()
      .single()
    if (error) throw error

    const currentMemberCount = 0
    const color = MEMBER_COLORS[currentMemberCount % MEMBER_COLORS.length]
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      weekly_goal: weeklyGoal,
      color,
    })

    await fetchGroups()
    return group as Group
  }, [fetchGroups])

  const joinGroup = useCallback(async (
    inviteCode: string,
    weeklyGoal: number,
    userId: string
  ) => {
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()
    if (!group) throw new Error('유효하지 않은 초대코드입니다')

    const { data: existingMembers } = await supabase
      .from('group_members')
      .select('id, color')
      .eq('group_id', group.id)

    const usedColors = (existingMembers || []).map((m: { color: string }) => m.color)
    const color = MEMBER_COLORS.find((c) => !usedColors.includes(c)) || MEMBER_COLORS[0]

    const { error } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      weekly_goal: weeklyGoal,
      color,
    })
    if (error) {
      if (error.code === '23505') throw new Error('이미 참여 중인 그룹입니다')
      throw error
    }

    await fetchGroups()
    return group as Group
  }, [fetchGroups])

  const getGroupByInviteCode = useCallback(async (code: string) => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .single()
    return data as Group | null
  }, [])

  const deleteGroup = useCallback(async (groupId: string) => {
    await supabase.from('groups').delete().eq('id', groupId)
    await fetchGroups()
  }, [fetchGroups])

  const kickMember = useCallback(async (groupId: string, memberId: string) => {
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', memberId)
    await fetchMembers(groupId)
  }, [fetchMembers])

  const leaveGroup = useCallback(async (groupId: string, userId: string) => {
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    await fetchGroups()
  }, [fetchGroups])

  const updateWeeklyGoal = useCallback(async (groupId: string, userId: string, goal: number) => {
    await supabase
      .from('group_members')
      .update({ weekly_goal: goal })
      .eq('group_id', groupId)
      .eq('user_id', userId)
  }, [])

  const regenerateInviteCode = useCallback(async (groupId: string) => {
    const newCode = generateInviteCode()
    await supabase.from('groups').update({ invite_code: newCode }).eq('id', groupId)
    await fetchGroups()
    return newCode
  }, [fetchGroups])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return {
    groups,
    members,
    loading,
    fetchGroups,
    fetchMembers,
    createGroup,
    joinGroup,
    getGroupByInviteCode,
    deleteGroup,
    kickMember,
    leaveGroup,
    updateWeeklyGoal,
    regenerateInviteCode,
  }
}
