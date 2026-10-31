import { supabase } from './supabase'

const LINKED_KEY = 'checkly_user_linked'

// 익명 로그인 세션을 준비하고, 로그인 없이 만들었던 기존 사용자를 이 계정에 연결
export async function ensureAuth(localUserId: string | null): Promise<void> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.warn('익명 로그인 실패:', error.message)
      return
    }
  }

  if (localUserId && localStorage.getItem(LINKED_KEY) !== localUserId) {
    const { data: linked, error } = await supabase.rpc('claim_user', { p_user_id: localUserId })
    if (error) {
      console.warn('사용자 연결 실패:', error.message)
      return
    }
    if (linked) localStorage.setItem(LINKED_KEY, localUserId)
  }
}
