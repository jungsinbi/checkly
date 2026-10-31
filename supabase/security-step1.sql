-- ============================================================
-- Checkly 보안 1단계 — 익명 로그인 연결 준비
-- 기존 정책은 그대로 두므로 지금 쓰는 앱이 깨지지 않아요.
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- ============================================================

-- 사용자 행 ↔ 익명 로그인 계정 연결
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE DEFAULT auth.uid();

-- 지금 로그인한 계정의 users.id
CREATE OR REPLACE FUNCTION public.my_user_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1
$$;

-- 내가 속한 그룹 id 목록
CREATE OR REPLACE FUNCTION public.my_group_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM group_members WHERE user_id = public.my_user_id()
$$;

-- 기존 사용자(로그인 없이 만든 행)를 처음 로그인한 계정에 연결
-- 2단계에서 삭제해요
CREATE OR REPLACE FUNCTION public.claim_user(p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  UPDATE users SET auth_id = auth.uid()
   WHERE id = p_user_id AND (auth_id IS NULL OR auth_id = auth.uid());
  RETURN FOUND;
END
$$;

-- 초대코드로 그룹 미리보기 (아직 멤버가 아니어도 볼 수 있게)
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(p_code text) RETURNS SETOF groups
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM groups WHERE invite_code = upper(p_code) LIMIT 1
$$;

-- 초대코드로 그룹 참여
CREATE OR REPLACE FUNCTION public.join_group(p_code text, p_weekly_goal int) RETURNS groups
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := public.my_user_id();
  g groups;
  -- src/types/index.ts 의 MEMBER_COLORS 와 같은 순서
  palette text[] := ARRAY['#A898D8', '#6EBFA8', '#D098C0', '#F0B870', '#88B8E0', '#A8C888'];
  picked text;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not_signed_in';
  END IF;

  SELECT * INTO g FROM groups WHERE invite_code = upper(p_code);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = me) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  SELECT c INTO picked
    FROM unnest(palette) WITH ORDINALITY AS t(c, ord)
   WHERE c NOT IN (SELECT color FROM group_members WHERE group_id = g.id AND color IS NOT NULL)
   ORDER BY ord
   LIMIT 1;

  INSERT INTO group_members (group_id, user_id, weekly_goal, color)
  VALUES (g.id, me, least(greatest(p_weekly_goal, 1), 7), coalesce(picked, palette[1]));

  RETURN g;
END
$$;

GRANT EXECUTE ON FUNCTION public.my_user_id(), public.my_group_ids(),
  public.claim_user(uuid), public.get_group_by_invite_code(text), public.join_group(text, int)
  TO authenticated;
