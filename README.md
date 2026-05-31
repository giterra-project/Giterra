# Giterra

Giterra는 사용자가 선택한 GitHub 레포지토리를 하나의 은하계로 시각화하는 인터랙티브 포트폴리오 서비스입니다.

현재 기획 기준은 기존의 “하나의 행성을 8등분해서 꾸미는 구조”가 아니라, **중앙 태양 + 사용자가 선택한 최대 8개의 레포지토리 행성**이 공전하는 **2.5D 은하계 구조**입니다.

---

## 핵심 컨셉

```text
GitHub 로그인
  → 내 레포지토리 조회
  → 최대 8개 레포지토리 선택
  → 레포지토리 분석
  → 레포별 행성 타입/요약 생성
  → 중앙 태양 주변을 도는 은하계로 시각화
```

Giterra의 목적은 단순한 GitHub 통계 표기가 아니라, **개발자의 프로젝트 이력을 하나의 우주처럼 탐험 가능한 경험으로 바꾸는 것**입니다.

---

## 현재 제품 방향

### 이전 방향

- 하나의 3D 행성을 8개 구역으로 분할
- 각 구역에 레포지토리/개발 성향 요소 배치
- R3F 기반 3D 행성 커스터마이징 중심

### 현재 방향

- 사용자가 직접 고른 최대 8개 레포지토리가 각각 하나의 행성이 됨
- 중앙 태양을 기준으로 8개 행성이 서로 다른 속도로 공전
- 레포지토리 특성/분석 결과에 따라 행성 타입과 스킨을 결정
- 초기 MVP는 무거운 3D 모델보다 **WebP + SVG + CSS 기반 2.5D UI**를 우선 검증
- 기존 3D 행성 화면은 `Legacy 3D` 모드로 보존

---

## 기술 스택

### Frontend

- React 19
- TypeScript
- Vite / Rolldown Vite
- Zustand
- TanStack Query
- Framer Motion
- Three.js / React Three Fiber / Drei
- CSS 기반 2.5D animation
- WebP image assets

### Backend

- FastAPI
- SQLModel / SQLAlchemy AsyncSession
- PostgreSQL
- uv
- httpx
- PyJWT
- GitHub REST API
- LangGraph / Google GenAI 의존성 포함

---

## 주요 화면/라우트

### Frontend

| Path | File | 역할 |
| --- | --- | --- |
| `/` | `frontend/src/pages/Main/MainPage.tsx` | 메인 페이지 |
| `/login/callback` | `frontend/src/pages/Login/LoginCallback.tsx` | OAuth 완료 후 JWT 저장 |
| `/planet` | `frontend/src/pages/Planet/PlanetPage.tsx` | 2.5D 은하계 화면 |
| `/mypage` | `frontend/src/pages/MyPage/MyPage.tsx` | 사용자 프로필/마이페이지 |

### Backend

| Prefix | File | 역할 |
| --- | --- | --- |
| `/auth` | `backend/app/routers/auth.py` | GitHub OAuth, JWT, 내 정보 조회 |
| `/repos` | `backend/app/routers/repo.py` | GitHub username 기반 repo 조회 |
| `/user` | `backend/app/routers/user.py` | 내 profile/repos/planet placement |
| `/analyze` | `backend/app/routers/analyze.py` | 레포지토리 분석 결과 |

---

## 로그인 흐름

```text
Header 로그인 버튼
  → useAuthStore.login()
  → GET /auth/login
  → GitHub OAuth
  → GET /auth/callback
  → backend가 Giterra JWT 발급
  → /login/callback?token={jwt}
  → frontend가 GET /auth/me 호출
  → Zustand auth-storage에 사용자/JWT 저장
```

프론트 인증 상태는 `frontend/src/store/useAuthStore.ts`에서 관리합니다.

---

## 은하계 UI 구현 상태

현재 `/planet`의 기본 화면은 2.5D 은하계 프로토타입입니다.

주요 파일:

```text
frontend/src/components/galaxy/GalaxyOrbitPreview.tsx
frontend/src/pages/Planet/PlanetPage.tsx
frontend/src/pages/Planet/LegacyPlanetPage.tsx
frontend/src/index.css
```

현재 구현:

- 중앙 태양 1개
- 공전 행성 8개
- SVG ellipse 기반 궤도선
- 각 행성별 다른 공전 속도/크기/깊이감
- `scale`, `opacity`, `brightness`, `blur`, `z-index`로 2.5D 깊이 표현
- PNG asset을 WebP로 최적화
- 기존 3D 행성 화면은 `Legacy 3D` 버튼으로 lazy-load

현재 asset 위치:

```text
frontend/src/assets/models/*.webp
```

---

## 로컬 실행

### 1. Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host localhost --port 8000
```

확인:

```text
http://localhost:8000/
http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm ci
npm run dev -- --host localhost --port 5173
```

확인:

```text
http://localhost:5173/
```

---

## 환경 변수

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_REDIRECT_URI=http://localhost:5173/login/callback
```

### Backend `.env`

```env
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/giterra
GITHUB_TOKEN=your_personal_access_token
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
FRONTEND_URL=http://localhost:5173
JWT_SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> `.env`에는 실제 token/secret이 들어가므로 Git에 커밋하지 않습니다.

---

## 현재 검증 상태

확인 완료:

- GitLab 최신 clone 기준 실행
- `http://localhost:5173/` frontend 정상 응답
- `http://localhost:8000/` backend 정상 응답
- `/auth/login` GitHub OAuth redirect 정상
- `npm run build` 통과
- 변경 파일 대상 ESLint 통과

알려진 이슈:

- 전체 `npm run lint`는 기존 코드 lint 이슈로 실패 중
- `frontend/src/services/api.ts`에 API base URL 하드코딩 정리 필요
- 인증 헤더가 `token`/`Bearer`로 혼재되어 있어 통일 필요
- `/analyze`는 mock 데이터 중심이며 실제 분석 연동 보강 필요
- `/user/planets` 저장 정책은 replace/upsert 기준을 명확히 정리해야 함
- 2.5D 은하계는 아직 실제 선택 레포 데이터와 완전히 연결되지 않은 프로토타입 단계

---

## 다음 작업 우선순위

1. API base URL / Authorization header 통일
2. 로그인 후 `/user/repos`로 내 레포 목록 조회
3. 최대 8개 레포 선택 UI 구현
4. `/user/planets` 저장 정책 정리 및 프론트 연결
5. 실제 selected repo 데이터를 2.5D 은하계에 바인딩
6. 행성 타입/스킨 매핑 룰 확정
7. `/analyze` mock 제거 및 실제 분석 결과 연결
8. 최종 시연 모드: 2.5D 기본 + Legacy 3D 옵션 유지 여부 결정

---

## 관련 문서

- Notion 업데이트 초안: `docs/NOTION_GITERRA_PROJECT_OS_UPDATE.md`
- Backend guide: `backend/README.md`
- Frontend guide: `frontend/README.md`
- Planet placement API: `backend/docs/PLANET_PLACEMENT_API.md`
- Data pipeline: `backend/docs/DATA_PIPELINE.md`
