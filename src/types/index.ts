export interface User {
  id: string
  nickname: string
  icon: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  icon: string | null
  invite_code: string
  owner_id: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  weekly_goal: number
  color: string
  joined_at: string
  users?: User
}

export interface StudyLog {
  id: string
  user_id: string
  group_id: string
  date: string
  is_done: boolean
  created_at: string
}

export interface Memo {
  id: string
  user_id: string
  group_id: string
  date: string
  content: string
  created_at: string
}

export const MEMBER_COLORS = [
  '#A898D8',
  '#6EBFA8',
  '#D098C0',
  '#F0B870',
  '#88B8E0',
  '#A8C888',
]

export const EMOJI_LIST = [
  '📚', '💪', '🧘', '🎵', '🎨', '✍️', '🏃', '🚴', '🧠', '💻',
  '🌟', '🔥', '⚡', '🌈', '🎯', '🏆', '💎', '🦋', '🌸', '🍀',
  '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🦉',
  '🍎', '🍋', '🍇', '🌮', '🍕', '☕', '🧋', '🎂', '🍩', '🍓',
]
