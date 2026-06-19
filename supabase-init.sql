-- ============================================================
-- Checkly — Supabase 초기화 SQL
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────── 테이블 생성 ───────────────

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

-- 메모 (개인 전용)
CREATE TABLE IF NOT EXISTS memos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  date date NOT NULL,
  content text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id, date)
);

-- ─────────────── RLS 활성화 ───────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- ─────────────── RLS 정책 ───────────────
-- 앱에서 anon key로 user_id를 request header로 전달합니다
-- 예: supabase.rpc() 또는 custom header 방식

-- users: 누구나 읽기/쓰기 (간단한 익명 앱 구조)
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON users FOR DELETE USING (true);

-- groups: 누구나 읽기/쓰기 (초대코드 기반 접근)
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (true);
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (true);

-- group_members: 누구나 읽기/쓰기
CREATE POLICY "members_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "members_update" ON group_members FOR UPDATE USING (true);
CREATE POLICY "members_delete" ON group_members FOR DELETE USING (true);

-- study_logs: 누구나 읽기/쓰기 (같은 그룹 멤버만 조회하는 로직은 앱에서 처리)
CREATE POLICY "logs_select" ON study_logs FOR SELECT USING (true);
CREATE POLICY "logs_insert" ON study_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "logs_update" ON study_logs FOR UPDATE USING (true);
CREATE POLICY "logs_delete" ON study_logs FOR DELETE USING (true);

-- memos: 누구나 읽기/쓰기 (앱에서 user_id로 필터링)
CREATE POLICY "memos_select" ON memos FOR SELECT USING (true);
CREATE POLICY "memos_insert" ON memos FOR INSERT WITH CHECK (true);
CREATE POLICY "memos_update" ON memos FOR UPDATE USING (true);
CREATE POLICY "memos_delete" ON memos FOR DELETE USING (true);

-- ─────────────── Realtime 활성화 ───────────────
-- Supabase Dashboard → Database → Replication에서
-- study_logs 테이블의 realtime을 활성화하세요
