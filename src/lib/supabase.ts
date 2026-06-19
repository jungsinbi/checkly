import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

// DB 초기화 SQL (Supabase SQL Editor에서 실행)
export const DB_INIT_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname text NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- 그룹
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  icon text,
  invite_code text UNIQUE,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 그룹 멤버
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  weekly_goal int DEFAULT 5,
  color text,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 학습 기록
CREATE TABLE IF NOT EXISTS study_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id, date)
);

-- 메모
CREATE TABLE IF NOT EXISTS memos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  date date NOT NULL,
  content text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id, date)
);

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- users: 누구나 읽기, 본인만 수정
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id::text = current_setting('app.user_id', true));

-- groups: 멤버만 읽기
CREATE POLICY "Groups viewable by members" ON groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id::text = current_setting('app.user_id', true))
);
CREATE POLICY "Anyone can create groups" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner can update group" ON groups FOR UPDATE USING (
  owner_id::text = current_setting('app.user_id', true)
);
CREATE POLICY "Owner can delete group" ON groups FOR DELETE USING (
  owner_id::text = current_setting('app.user_id', true)
);

-- group_members: 같은 그룹 멤버 읽기
CREATE POLICY "Members viewable by group members" ON group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id::text = current_setting('app.user_id', true))
);
CREATE POLICY "Anyone can join group" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update own record" ON group_members FOR UPDATE USING (
  user_id::text = current_setting('app.user_id', true)
);
CREATE POLICY "Members can leave" ON group_members FOR DELETE USING (
  user_id::text = current_setting('app.user_id', true)
);

-- study_logs: 같은 그룹 멤버 읽기, 본인만 쓰기
CREATE POLICY "Logs viewable by group members" ON study_logs FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id::text = current_setting('app.user_id', true))
);
CREATE POLICY "Users can manage own logs" ON study_logs FOR INSERT WITH CHECK (
  user_id::text = current_setting('app.user_id', true)
);
CREATE POLICY "Users can update own logs" ON study_logs FOR UPDATE USING (
  user_id::text = current_setting('app.user_id', true)
);

-- memos: 본인만 모든 작업
CREATE POLICY "Users can manage own memos" ON memos FOR ALL USING (
  user_id::text = current_setting('app.user_id', true)
);
`
