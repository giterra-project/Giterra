# Giterra Project OS — 현재 기획/구현 기준 업데이트 초안

> Notion 페이지 `Giterra Project OS`를 현재 GitLab 프로젝트 기준으로 갱신하기 위한 붙여넣기용 초안입니다.
> 기준 repo: `https://lab.ssafy.com/giterra/giterra.git`
> 로컬 기준: `giterra-ssafy`

---

## 1. 프로젝트 한 줄 정의

**Giterra는 사용자가 선택한 GitHub 레포지토리를 하나의 2.5D 은하계로 시각화하여, 개발 이력과 레포지토리 특성을 행성으로 보여주는 인터랙티브 포트폴리오 서비스다.**

기존의 “하나의 행성을 8등분해서 꾸미는 구조”에서, 현재 방향은 **중앙 태양 + 최대 8개의 레포지토리 행성이 공전하는 은하계 구조**로 전환한다.

---

## 2. 핵심 기획 방향

### 기존 방향

- 하나의 행성 표면을 8개 구역으로 나눈다.
- 각 구역에 레포지토리/개발 성향 요소를 배치한다.
- 3D 행성 기반 커스터마이징을 중심으로 구현한다.

### 현재 방향

- 사용자가 최대 8개의 레포지토리를 선택한다.
- 선택된 레포지토리들은 중앙 태양 주변을 도는 각각의 행성이 된다.
- 각 행성의 스타일은 레포지토리의 분석 결과에 따라 달라진다.
- 3D 오브젝트 중심보다 **가벼운 2.5D WebP 기반 은하계 UI**를 우선 검증한다.

---

## 3. 사용자 경험 흐름

```text
메인 페이지
  → GitHub 로그인
  → 내 레포지토리 조회
  → 사용자가 최대 8개 레포지토리 선택
  → 선택 레포지토리 저장
  → 분석 결과 기반 행성 타입/요약 생성
  → 중앙 태양 + 8개 레포 행성 은하계 표시
```

### MVP 목표

- GitHub OAuth 로그인 가능
- 로그인 유저의 레포지토리 목록 조회 가능
- 사용자가 레포지토리를 슬롯 0~7에 배치 가능
- `/planet` 화면에서 2.5D 은하계 프로토타입 확인 가능
- 추후 각 행성에 레포지토리 분석 결과/요약/스킨을 연결

---

## 4. 현재 프론트엔드 구조

### 주요 라우트

| 경로 | 파일 | 역할 |
| --- | --- | --- |
| `/` | `frontend/src/pages/Main/MainPage.tsx` | 메인 페이지 |
| `/login/callback` | `frontend/src/pages/Login/LoginCallback.tsx` | OAuth 완료 후 JWT 수신/저장 |
| `/planet` | `frontend/src/pages/Planet/PlanetPage.tsx` | 현재 2.5D 은하계 기본 화면 |
| `/mypage` | `frontend/src/pages/MyPage/MyPage.tsx` | 로그인 사용자 정보/프로필 화면 |

### 인증 상태 관리

파일: `frontend/src/store/useAuthStore.ts`

- Zustand + persist 사용
- localStorage key: `auth-storage`
- 저장 데이터:
  - `user`
  - `accessToken`
  - `isAuthenticated`
  - `isLoggingIn`

### 로그인 흐름

```text
Header 로그인 버튼
  → useAuthStore.login()
  → `${VITE_API_BASE_URL}/auth/login` 이동
  → GitHub OAuth
  → backend /auth/callback
  → frontend /login/callback?token={Giterra JWT}
  → /auth/me 요청
  → Zustand auth-storage 저장
  → 메인 페이지 이동
```

### 2.5D 은하계 화면

파일:

- `frontend/src/components/galaxy/GalaxyOrbitPreview.tsx`
- `frontend/src/pages/Planet/PlanetPage.tsx`
- `frontend/src/index.css`

현재 구현 상태:

- 중앙 태양 1개
- 공전 행성 8개
- 각 행성은 서로 다른 속도/크기/깊이감으로 공전
- SVG ellipse 기반 궤도선 사용
- 행성 중심점과 궤도선이 같은 수식/radius를 공유하도록 구성
- PNG 에셋을 WebP로 최적화하여 로딩 부담 감소

현재 사용 에셋:

```text
frontend/src/assets/models/sun.webp
frontend/src/assets/models/earth.webp
frontend/src/assets/models/mercury.webp
frontend/src/assets/models/venus.webp
```

---

## 5. 현재 백엔드 구조

### 기술 스택

- FastAPI
- SQLModel / SQLAlchemy AsyncSession
- PostgreSQL
- uv
- httpx
- PyJWT
- GitHub REST API
- LangGraph / Google GenAI 의존성 포함

### 주요 라우터

| Prefix | 파일 | 역할 |
| --- | --- | --- |
| `/auth` | `backend/app/routers/auth.py` | GitHub OAuth, JWT 발급, 내 정보 조회 |
| `/repos` | `backend/app/routers/repo.py` | 특정 GitHub username 레포지토리 조회 |
| `/user` | `backend/app/routers/user.py` | 내 프로필, 내 레포 목록, 행성 배치 저장 |
| `/analyze` | `backend/app/routers/analyze.py` | 레포지토리 분석 결과 반환, 현재 mock 중심 |

### 인증 API

```text
GET /auth/login
GET /auth/callback
GET /auth/me
POST /auth/logout
DELETE /auth/user
```

특징:

- GitHub OAuth 인증은 백엔드가 담당한다.
- GitHub access token은 DB에 저장한다.
- 프론트에는 Giterra 자체 JWT를 전달한다.
- `Authorization: token {jwt}` 또는 `Authorization: Bearer {jwt}` 모두 처리 가능하다.

### 사용자/레포 API

```text
GET /user/profile
GET /user/repos
PUT /user/planets
```

`PUT /user/planets`는 사용자가 선택한 레포지토리를 0~7 슬롯에 배치한다.

요청 예시:

```json
{
  "planets": [
    { "repo_id": 1, "slot_index": 0 },
    { "repo_id": 2, "slot_index": 1 }
  ]
}
```

---

## 6. 데이터 모델

### User

- GitHub OAuth 사용자
- GitHub ID, username, avatar, profile URL, GitHub access token 저장

### Repository

- GitHub 레포지토리 정보
- repo name, URL, description, latest commit
- 분석 결과 필드:
  - `planet_type`
  - `analysis_summary`
  - `analysis_sub1`
  - `analysis_sub2`
  - `analysis_sub3`

### Planet

- 유저가 선택한 레포지토리의 은하계 배치 정보
- `slot_index`: 0~7
- `repo_id`는 unique

---

## 7. 레포지토리 분석/행성 타입 방향

현재 분석 방향은 레포지토리/커밋 데이터를 기반으로 행성 타입과 설명을 만드는 것이다.

분석 관점 예시:

- 기술/아키텍처 관점
- 안정성/유지보수 관점
- 커밋 컨벤션/소통 관점
- 종합 요약

행성 타입 예시:

```text
수성, 금성, 지구, 화성, 목성, 토성, 천왕성, 해왕성
```

향후에는 각 레포지토리 분석 결과를 바탕으로:

- 행성 이미지/스킨
- 행성 크기
- 공전 속도
- 궤도 위치
- 레포지토리 설명 카드
- 구매/뽑기형 스킨 시스템

으로 확장할 수 있다.

---

## 8. UI/비주얼 의사결정

### 3D 중심 대신 2.5D를 우선 검증하는 이유

- 3D 모델 9개를 실시간 렌더링하면 초기 로딩/FPS 부담이 커질 수 있다.
- 현재 서비스의 핵심은 “레포지토리가 은하계를 이룬다”는 이해 가능한 경험이다.
- 2.5D WebP/SVG/CSS 조합은 구현 속도가 빠르고, 모바일 대응도 수월하다.
- 추후 고급 모드로 3D를 보존/확장할 수 있다.

### 현재 비주얼 구조

- 배경: 우주/네뷸라 느낌의 CSS 레이어
- 중앙: 태양 WebP
- 궤도: SVG ellipse
- 행성: WebP 이미지 + CSS transform
- 깊이감: scale, opacity, brightness, blur, z-index 조합

---

## 9. 현재 실행 방법

### Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host localhost --port 8000
```

### Frontend

```bash
cd frontend
npm ci
npm run dev -- --host localhost --port 5173
```

### 환경 변수

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_REDIRECT_URI=http://localhost:5173/login/callback
```

Backend `.env` 주요 항목:

```env
DATABASE_URL=...
GITHUB_TOKEN=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
JWT_SECRET_KEY=...
```

---

## 10. 현재 검증 상태

### 확인 완료

- GitLab 최신 클론 기준 작업
- 프론트 서버 `http://localhost:5173` 정상 응답
- 백엔드 서버 `http://localhost:8000` 정상 응답
- `/auth/login` GitHub OAuth redirect 정상
- `npm run build` 통과
- 변경 파일 대상 ESLint 통과

### 남은 이슈

- 전체 `npm run lint`는 기존 코드의 lint 에러로 실패 중
- `frontend/src/services/api.ts`에 `http://localhost:8080` 하드코딩이 남아 있어 API base URL 통일 필요
- 인증 헤더가 `token`/`Bearer`로 혼재되어 있어 프론트 코드 통일 필요
- `/analyze` 라우터는 현재 mock 데이터 중심이며 실제 분석 연동 보강 필요
- `PUT /user/planets`는 기존 배치 삭제/replace 정책 정리가 필요
- 2.5D 은하계는 프로토타입 단계이며 실제 레포 선택 데이터 연결 필요

---

## 11. 다음 작업 우선순위

1. 로그인/API base URL 정리
   - `frontend/src/services/api.ts`의 base URL을 `VITE_API_BASE_URL` 기준으로 통일
   - Authorization header를 `Bearer {token}` 또는 공통 helper로 통일

2. 레포 선택 → 행성 배치 연결
   - `/user/repos`로 내 레포 목록 가져오기
   - 사용자가 최대 8개 선택
   - `/user/planets` 저장
   - 저장된 배치를 `/planet` 은하계 화면에 반영

3. 2.5D 은하계 데이터 바인딩
   - 8개 공전 행성을 mock이 아닌 실제 selected repo 기반으로 렌더링
   - 행성 hover/click 시 레포 정보 카드 표시

4. 행성 타입/스킨 룰 정리
   - 레포 분석 결과와 행성 타입 매핑
   - 기본 WebP 스킨 세트 정의
   - 추후 뽑기/상점형 스킨 시스템 기획

5. 2.5D 은하계 UX 고도화
   - 카드별 분석/슬롯 배치 흐름 검증
   - 행성 WebP 스킨과 분석 결과 연결 강화

---

## 12. 현재 프로젝트 방향 요약

Giterra의 핵심은 단순히 GitHub 통계를 보여주는 것이 아니라, **사용자의 개발 활동을 하나의 우주로 변환하는 경험**이다.

따라서 현재 방향은 다음과 같다.

```text
GitHub 레포지토리 선택
  → 레포지토리 특성 분석
  → 행성 타입/스킨 결정
  → 중앙 태양 주변을 도는 8개 행성 은하계 구성
  → 사용자가 자신의 개발 세계를 시각적으로 탐험
```

이번 기획 전환의 핵심은 “하나의 행성 커스터마이징”이 아니라, **사용자가 직접 고른 레포지토리들이 하나의 은하계를 이룬다**는 점이다.
