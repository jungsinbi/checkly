import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BottomTabBar } from './components/common/BottomTabBar'
import { CalendarPage } from './pages/CalendarPage'
import { StatsPage } from './pages/StatsPage'
import { MemoPage } from './pages/MemoPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { GroupNewPage } from './pages/GroupNewPage'
import { GroupJoinPage } from './pages/GroupJoinPage'
import { getLocalUser, setLocalUser } from './lib/storage'
import { useUser } from './hooks/useUser'
import { useGroups } from './hooks/useGroups'
import { ensureAuth } from './lib/auth'
import type { User } from './types'

function MainApp({ user, onUserUpdate, onLogout }: { user: User; onUserUpdate: (u: User) => void; onLogout: () => void }) {
  const { createGroup, joinGroup, getGroupByInviteCode } = useGroups(user.id)

  return (
    <>
      <Routes>
        <Route path="/" element={<CalendarPage user={user} />} />
        <Route path="/stats" element={<StatsPage user={user} />} />
        <Route path="/memo" element={<MemoPage user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} onUserUpdate={onUserUpdate} onLogout={onLogout} />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/group/new" element={<GroupNewPage user={user} createGroup={createGroup} />} />
        <Route path="/group/join" element={<GroupJoinPage user={user} getGroupByInviteCode={getGroupByInviteCode} joinGroup={joinGroup} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomTabBar />
    </>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(getLocalUser)
  const [authReady, setAuthReady] = useState(false)
  const { createUser } = useUser()

  useEffect(() => {
    ensureAuth(getLocalUser()?.id ?? null).finally(() => setAuthReady(true))
  }, [])

  function handleOnboardingComplete(u: User) {
    setLocalUser(u)
    setUser(u)
  }

  function handleLogout() {
    setUser(null)
  }

  if (!authReady) return null

  return (
    <BrowserRouter>
      {!user ? (
        <OnboardingPage onComplete={handleOnboardingComplete} createUser={createUser} />
      ) : (
        <MainApp
          user={user}
          onUserUpdate={(u) => { setLocalUser(u); setUser(u) }}
          onLogout={handleLogout}
        />
      )}
    </BrowserRouter>
  )
}
