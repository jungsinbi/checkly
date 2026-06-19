# Checkly — 앱 설계 명세서

## 개요

- **앱 이름**: Checkly
- **목적**: 소규모 그룹(최대 6명)이 함께 습관(영어, 운동 등)을 매일 체크하고 서로 공유해 동기부여하는 PWA 웹앱
- **타겟**: 스마트폰 사용자 (어르신도 사용하므로 글자 크기 넉넉하게)
- **기술 스택**: React (Vite) + PWA, Supabase (PostgreSQL + 실시간), Vercel (호스팅), GitHub

---

## 디자인 시스템

### 폰트

```
font-family: 'Nunito', sans-serif
import: https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap
```

### 아이콘

```
Phosphor Icons (Regular)
import: https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css
```

그룹 아이콘은 이모지 사용 (사용자가 그룹 생성 시 직접 선택)

### 컬러 시스템

```css
/* 배경 */
--color-bg-app: #EDE8F8          /* 앱 전체 배경 (연라벤더) */
--color-bg-card: #FFFFFF          /* 카드 배경 (흰색) */
--color-bg-group-icon: #D8D0EE   /* 비활성 그룹 아이콘 배경 */
--color-bg-toggle: #D8D0EE       /* 월별/주간 토글 배경 */
--color-bg-input: #F5F2FC        /* 입력 필드 배경 */

/* 보라 포인트 */
--color-primary: #7B6BBF          /* 주 포인트 (활성 탭, 오늘 날짜 등) */
--color-primary-light: #EDE8F8   /* 연보라 배경 */
--color-primary-muted: #B0A8D0   /* 비활성 텍스트/아이콘 */

/* 민트 (완료/달성) */
--color-mint: #6EBFA8             /* 체크 완료, 달성 표시 */
--color-mint-light: #E4F8F0      /* 민트 카드 배경 */
--color-mint-muted: #A8D8C8      /* 연한 민트 */

/* 텍스트 */
--color-text-primary: #333333    /* 주요 텍스트 */
--color-text-secondary: #888888  /* 보조 텍스트 */
--color-text-muted: #B8B0CC      /* 힌트/비활성 */

/* 멤버 도트 색상 (최대 6명) */
--color-member-1: #A898D8        /* 보라 */
--color-member-2: #6EBFA8        /* 민트 */
--color-member-3: #D098C0        /* 핑크 */
--color-member-4: #F0B870        /* 오렌지 */
--color-member-5: #88B8E0        /* 블루 */
--color-member-6: #A8C888        /* 그린 */

/* 보더 */
--color-border: #E0D8F0          /* 카드 테두리 */
```

### 폰트 크기

```css
--font-size-xs: 13px
--font-size-sm: 15px
--font-size-md: 17px
--font-size-lg: 20px
--font-size-xl: 24px
--font-size-2xl: 28px
```

### 반경 / 간격

```css
--radius-sm: 12px
--radius-md: 18px
--radius-lg: 24px
--radius-full: 9999px

--spacing-page: 16px   /* 페이지 좌우 여백 */
--spacing-card: 18px   /* 카드 내부 패딩 */
```

---

## DB 스키마 (Supabase)

```sql
-- 사용자
users (
  id uuid PRIMARY KEY,
  nickname text NOT NULL,
  icon text,              -- 이모지 문자
  created_at timestamptz
)

-- 그룹
groups (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  icon text,              -- 이모지 문자
  invite_code text UNIQUE,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz
)

-- 그룹 멤버
group_members (
  id uuid PRIMARY KEY,
  group_id uuid REFERENCES groups(id),
  user_id uuid REFERENCES users(id),
  weekly_goal int DEFAULT 5,   -- 개인 주간 목표 횟수
  color text,                  -- 멤버 도트 색상
  joined_at timestamptz
)

-- 학습 기록
study_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  group_id uuid REFERENCES groups(id),
  date date NOT NULL,
  is_done boolean DEFAULT false,
  created_at timestamptz,
  UNIQUE(user_id, group_id, date)
)

-- 메모 (개인 전용)
memos (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  group_id uuid REFERENCES groups(id),
  date date NOT NULL,
  content text,
  created_at timestamptz,
  UNIQUE(user_id, group_id, date)
)
```

---

## 앱 구조

### 온보딩 플로우 (최초 실행)

1. 스플래시 화면 (Checkly 로고)
2. 닉네임 입력 화면
3. 프로필 아이콘 선택 화면 (이모지 그리드)
4. 완료 → 메인 진입

### 라우팅

```
/                    → 캘린더 (메인)
/stats               → 통계
/memo                → 메모
/profile             → 프로필
/group/new           → 그룹 생성
/group/join          → 그룹 참여 (초대코드 입력)
/group/:id/settings  → 그룹 설정
/onboarding          → 온보딩
```

### 하단 탭바 (공통)

4개 탭, 항상 고정 표시

| 탭 | 아이콘 | 라벨 |
|---|---|---|
| 캘린더 | ph-calendar | 캘린더 |
| 통계 | ph-chart-bar | 통계 |
| 메모 | ph-notebook | 메모 |
| 프로필 | ph-user | 프로필 |

- 활성: `--color-primary` (#7B6BBF)
- 비활성: `--color-text-muted` (#B8B0CC)
- 배경: 흰색, 상단 보더 `--color-border`

---

## 화면 명세

---

### 1. 캘린더 (메인)

#### 상단 헤더

- 좌측: 앱 타이틀 "Checkly" (28px, 700, `--color-primary`)
- 우측: 알림 아이콘(`ph-bell`), 설정 아이콘(`ph-gear`) — 각 26px, `--color-primary-muted`

#### 그룹 탭

- 헤더 아래 가로 스크롤 영역
- 각 그룹: 원형 아이콘(54×54px) + 이모지
  - 비활성: 배경 `--color-bg-group-icon`, 테두리 없음
  - 활성: 배경 흰색, 테두리 2.5px `--color-primary`
- 마지막에 + 버튼 (그룹 추가)
- 그룹 이름 텍스트 없음 (아이콘만)

#### 월별/주간 토글

- 배경 `--color-bg-toggle`, 내부 활성 탭은 흰색 배경
- 폰트 16px 700

#### 월별 캘린더

- 배경: 흰색 카드, `--radius-lg`, `--color-border` 테두리
- 상단: `<` 월 이름 `>` 네비게이션 (20px 700)
- 요일 헤더: 일월화수목금토 (14px 700 `--color-text-muted`)
- 날짜 셀 (min-height 52px):
  - 날짜 숫자: 32×32px 원형, 15px 700
  - 오늘: 배경 `--color-primary`, 흰색 텍스트
  - 다른 달: `--color-text-muted`
  - 멤버 도트: 7×7px 원형, 완료한 멤버 색상으로 표시 (최대 6개)
  - ✨ 이모지: 전원 달성 시 도트 대신 표시
  - 메모 점: 5×5px `--color-member-3` — 내 뷰(본인만 볼 수 있음)에서 메모 있는 날짜에 표시

#### 주간 캘린더

- 배경: 흰색 카드
- 상단: `<` 주간 범위(예: 7/13 — 7/19) `>`
- 그리드: 멤버별 행 × 요일별 열
  - 행 헤더: 멤버 아바타(26×26px 원형) + 이름 (13px 700)
  - 셀: 30×30px 라운드 사각형
    - 완료: 배경 `--color-mint`, 흰색 체크 아이콘
    - 미완료: 배경 `--color-primary-light`
    - 오늘(미완료): 테두리 1.5px `--color-mint`
- 오늘 요일 컬럼 헤더: 배경 `--color-primary-light`, `--color-primary` 텍스트

#### 오늘 체크 카드

- 배경: 흰색, 테두리 `--color-border`
- 상단: "오늘 N월 N일" (15px `--color-text-secondary`)
- 중앙 좌측:
  - 상태 텍스트 (20px 700): 완료 시 "공부했어요!" / 미완료 시 "아직 체크 전이에요"
  - 스트릭 (15px 700 `--color-primary`): 🔥 N일 연속 달성 중
- 중앙 우측: 체크 버튼 (64×64px 원형)
  - 완료: 배경 `--color-mint`, 흰색 체크 아이콘 32px
  - 미완료: 배경 `--color-mint-light`, 민트 체크 아이콘
  - 탭하면 토글 (과거 날짜도 수정 가능 — 날짜 클릭 시 모달)

#### 주간 목표 카드

- 배경: 흰색, 테두리 `--color-border`
- 상단: "이번 주 목표 N회 중 N회 완료" (15px `--color-text-secondary`)
- 요일 도트 7개 (34×34px 원형):
  - 완료: 배경 `--color-mint`, 흰색 텍스트
  - 오늘(미완료): 테두리 2.5px `--color-mint`, `--color-mint` 텍스트
  - 미완료: 배경 `--color-bg-group-icon`, `--color-text-muted`

#### 날짜 클릭 모달

- 날짜 탭 시 바텀 시트 형태로 올라옴
- 내용:
  - 날짜 표시
  - 체크 토글 버튼
  - 메모 입력 textarea (나만 볼 수 있음 안내 문구)
  - 저장 / 닫기 버튼

---

### 2. 통계

#### 상단 탭

- 내 통계 / 그룹 통계 탭 전환

#### 내 통계 탭

**전체 그룹 주간 그리드** (참여 중인 그룹이 여러 개일 때 한눈에)
- 행: 그룹별 (그룹 이모지 + 이름)
- 열: 요일별
- 셀: 완료 `--color-mint`, 미완료 `--color-primary-light`

**요약 카드 (2×2 그리드)**
- 이번 달 달성률 (%)
- 현재 스트릭 (일)
- 최장 스트릭 (일)
- 총 달성일 (일)

**주간/월별 달성률 차트**
- 막대 차트 (Recharts 사용)
- 색상: `--color-primary`
- 주간 탭: 최근 8주
- 월별 탭: 최근 6개월

**목표 대비 달성률**
- 이번 주 목표 N회 중 N회 (진행 바)

#### 그룹 통계 탭

**멤버별 주간 그리드**
- 행: 멤버별
- 열: 요일별
- 동일한 그리드 UI

**그룹 요약 카드**
- 그룹 전체 달성률
- 오늘 체크한 멤버 수

**멤버별 달성률 차트**
- 가로 막대 차트
- 각 멤버 색상 사용

---

### 3. 메모

#### 상단

- 필터 체크박스: 참여 중인 그룹 목록 (이모지 + 이름)
  - 다중 선택 가능, 기본값 전체 선택
- 체크된 그룹의 메모만 표시

#### 메모 목록

- 날짜 내림차순 정렬
- 각 메모 카드:
  - 날짜 (15px `--color-text-secondary`)
  - 그룹 이모지 + 그룹 이름 (13px `--color-text-muted`)
  - 메모 내용 미리보기 (17px, 2줄 말줄임)
- 카드 탭 → 상세 보기 (전체 내용 표시, 수정/삭제 가능)
- 본인 메모만 표시 (다른 사람 메모는 볼 수 없음)

---

### 4. 프로필

#### 내 정보

- 아이콘 (이모지, 80×80px 원형 배경)
- 닉네임 (24px 700)
- 수정 버튼

#### 내 그룹 목록

- 참여 중인 그룹 카드 목록
- 각 카드: 그룹 이모지 + 이름 + 내 주간 목표 + 초대코드 복사 버튼
- 그룹 설정 버튼 (방장만) → 멤버 관리(강퇴), 그룹 삭제

#### 알림 설정

- 매일 공부 리마인더 푸시 알림 on/off
- 알림 시간 설정

#### 계정

- 탈퇴 / 계정 삭제 버튼 (빨간색, 확인 다이얼로그)

---

### 5. 그룹 생성 플로우

1. 그룹 이름 입력 (자유텍스트)
2. 그룹 아이콘 선택 (이모지 그리드)
3. 내 주간 목표 횟수 설정 (1-7회 슬라이더 또는 숫자 선택)
4. 생성 완료 → 초대코드 표시 화면 (복사 버튼)

---

### 6. 그룹 참여 플로우

1. 초대코드 6자리 입력
2. 그룹 정보 미리보기 (이름, 아이콘, 현재 멤버 수)
3. 내 주간 목표 횟수 설정
4. 참여 완료

---

## 공통 컴포넌트

### GroupTabBar

- 그룹 아이콘 가로 스크롤 목록
- props: groups[], activeGroupId, onSelect, onAdd

### CalendarGrid

- props: type ('monthly' | 'weekly'), logs, members, memos, onDateClick

### CheckButton

- 64×64px 원형 토글 버튼
- props: isDone, onToggle

### WeeklyGoalDots

- 7개 요일 도트
- props: goal (number), doneCount (number), todayIndex (number)

### MemoSheet

- 바텀 시트 모달
- props: date, groupId, initialMemo, onSave, onClose

### StatCard

- 요약 수치 카드
- props: label, value, unit

### BarChart

- Recharts 기반
- props: data, color

---

## PWA 설정

```json
// manifest.json
{
  "name": "Checkly",
  "short_name": "Checkly",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#EDE8F8",
  "theme_color": "#7B6BBF",
  "icons": [...]
}
```

- Service Worker: 오프라인 대응 (캐싱)
- 푸시 알림: Web Push API 사용

---

## 실시간 동기화

Supabase Realtime 구독:
- `study_logs` 테이블 변경 시 → 같은 그룹 멤버 캘린더 즉시 갱신
- 채널: `group:{group_id}`

---

## 기타 규칙

- 날짜 기준: 로컬 타임존
- 과거 날짜 체크/취소 모두 가능
- 메모는 본인만 열람 가능 (RLS 정책으로 보호)
- 그룹 인원 제한 없음 (실질적으로 6명 이하 운영 예정)
- 방장 권한: 초대코드 재생성, 멤버 강퇴, 그룹 삭제
