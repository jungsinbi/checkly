import type { User } from '../types'

const USER_KEY = 'checkly_user'

export function getLocalUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setLocalUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearLocalUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function getActiveGroupId(): string | null {
  return localStorage.getItem('checkly_active_group')
}

export function setActiveGroupId(id: string): void {
  localStorage.setItem('checkly_active_group', id)
}
