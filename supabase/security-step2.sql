-- ============================================================
-- Checkly 보안 2단계 — "내 데이터, 내 그룹만" 정책으로 교체
-- 새 버전 앱을 쓰는 모든 사람이 한 번씩 앱을 연 뒤에 실행하세요.
-- 먼저 아래 쿼리로 연결 상태를 확인하세요 (linked 가 모두 true 여야 해요):
--   SELECT nickname, auth_id IS NOT NULL AS linked FROM users;
-- ============================================================

-- 기존 정책 전부 삭제 (누구나 읽기/쓰기)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('users', 'groups', 'group_members', 'study_logs', 'memos')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END
$$;

-- users: 나와 같은 그룹 멤버만 보기, 본인만 수정
CREATE POLICY users_select ON users FOR SELECT TO authenticated USING (
  auth_id = auth.uid()
  OR id IN (SELECT user_id FROM group_members WHERE group_id IN (SELECT public.my_group_ids()))
);
CREATE POLICY users_insert ON users FOR INSERT TO authenticated WITH CHECK (auth_id = auth.uid());
CREATE POLICY users_update ON users FOR UPDATE TO authenticated
  USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
CREATE POLICY users_delete ON users FOR DELETE TO authenticated USING (auth_id = auth.uid());

-- groups: 멤버만 보기, 방장만 수정/삭제
CREATE POLICY groups_select ON groups FOR SELECT TO authenticated USING (
  id IN (SELECT public.my_group_ids()) OR owner_id = public.my_user_id()
);
CREATE POLICY groups_insert ON groups FOR INSERT TO authenticated WITH CHECK (owner_id = public.my_user_id());
CREATE POLICY groups_update ON groups FOR UPDATE TO authenticated
  USING (owner_id = public.my_user_id()) WITH CHECK (owner_id = public.my_user_id());
CREATE POLICY groups_delete ON groups FOR DELETE TO authenticated USING (owner_id = public.my_user_id());

-- group_members: 같은 그룹만 보기, 내 그룹 만들 때만 직접 추가 (참여는 join_group 함수로)
CREATE POLICY members_select ON group_members FOR SELECT TO authenticated USING (
  group_id IN (SELECT public.my_group_ids())
);
CREATE POLICY members_insert ON group_members FOR INSERT TO authenticated WITH CHECK (
  user_id = public.my_user_id()
  AND group_id IN (SELECT id FROM groups WHERE owner_id = public.my_user_id())
);
CREATE POLICY members_update ON group_members FOR UPDATE TO authenticated
  USING (user_id = public.my_user_id()) WITH CHECK (user_id = public.my_user_id());
CREATE POLICY members_delete ON group_members FOR DELETE TO authenticated USING (
  user_id = public.my_user_id()
  OR group_id IN (SELECT id FROM groups WHERE owner_id = public.my_user_id())
);

-- study_logs: 같은 그룹 기록 보기, 본인 기록만 쓰기
CREATE POLICY logs_select ON study_logs FOR SELECT TO authenticated USING (
  group_id IN (SELECT public.my_group_ids())
);
CREATE POLICY logs_insert ON study_logs FOR INSERT TO authenticated WITH CHECK (
  user_id = public.my_user_id() AND group_id IN (SELECT public.my_group_ids())
);
CREATE POLICY logs_update ON study_logs FOR UPDATE TO authenticated
  USING (user_id = public.my_user_id())
  WITH CHECK (user_id = public.my_user_id() AND group_id IN (SELECT public.my_group_ids()));
CREATE POLICY logs_delete ON study_logs FOR DELETE TO authenticated USING (user_id = public.my_user_id());

-- memos: 본인만
CREATE POLICY memos_all ON memos FOR ALL TO authenticated
  USING (user_id = public.my_user_id())
  WITH CHECK (user_id = public.my_user_id() AND group_id IN (SELECT public.my_group_ids()));

-- 기존 사용자 연결이 끝났으니 연결 함수 삭제
DROP FUNCTION IF EXISTS public.claim_user(uuid);
