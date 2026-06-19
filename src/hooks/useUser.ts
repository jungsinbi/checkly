import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getLocalUser, setLocalUser, clearLocalUser } from '../lib/storage'
import type { User } from '../types'

export function useUser() {
  const [user, setUser] = useState<User | null>(getLocalUser)
  const [loading, setLoading] = useState(false)

  const createUser = useCallback(async (nickname: string, icon: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({ nickname, icon })
        .select()
        .single()
      if (error) throw error
      setLocalUser(data as User)
      setUser(data as User)
      return data as User
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (updates: Partial<Pick<User, 'nickname' | 'icon'>>) => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      const updated = data as User
      setLocalUser(updated)
      setUser(updated)
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteAccount = useCallback(async () => {
    if (!user) return
    await supabase.from('users').delete().eq('id', user.id)
    clearLocalUser()
    setUser(null)
  }, [user])

  return { user, setUser, loading, createUser, updateUser, deleteAccount }
}
