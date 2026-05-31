# Giterra Backend

Giterra backend는 GitHub OAuth, GitHub 레포지토리 수집, 사용자 레포지토리 배치 저장, 레포지토리 분석 결과 API를 담당하는 FastAPI 서버입니다.

---

## 기술 스택

- Python 3.11+
- FastAPI
- uv
- PostgreSQL
- SQLModel / SQLAlchemy AsyncSession
- httpx
- PyJWT
- GitHub REST API
- LangGraph / Google GenAI 의존성 포함

---

## 실행

```bash
uv sync
uv run uvicorn main:app --reload --host localhost --port 8000
```

확인:

```text
http://localhost:8000/
http://localhost:8000/docs
```

---

## 환경 변수

`backend/.env`를 생성합니다.

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

> 실제 token/secret은 Git에 커밋하지 않습니다.

---

## GitHub OAuth App 설정

GitHub Developer Settings에서 OAuth App을 생성합니다.

```text
Homepage URL: http://localhost:8000
Authorization callback URL: http://localhost:8000/auth/callback
```

생성된 값을 `.env`에 넣습니다.

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## 주요 라우터

| Prefix | File | 역할 |
| --- | --- | --- |
| `/auth` | `app/routers/auth.py` | GitHub OAuth, Giterra JWT, 내 정보 조회 |
| `/repos` | `app/routers/repo.py` | GitHub username 기반 레포지토리 조회 |
| `/user` | `app/routers/user.py` | 내 프로필, 내 레포 목록, 행성 배치 저장 |
| `/analyze` | `app/routers/analyze.py` | 레포지토리 분석 결과 반환 |

---

## 인증 흐름

```text
GET /auth/login
  → GitHub OAuth authorize redirect

GET /auth/callback
  → GitHub code를 access token으로 교환
  → GitHub user 조회
  → DB user upsert
  → Giterra JWT 발급
  → `${FRONTEND_URL}/login/callback?token={jwt}` redirect

GET /auth/me
  → Authorization header의 JWT 검증
  → 현재 사용자 반환
```

`Authorization` header는 현재 다음 접두사를 처리합니다.

```text
token {jwt}
Bearer {jwt}
```

---

## 주요 API

### Auth

```text
GET    /auth/login
GET    /auth/callback
GET    /auth/me
POST   /auth/logout
DELETE /auth/user
```

### User

```text
GET /user/profile
GET /user/repos
PUT /user/planets
```

`PUT /user/planets` 요청 예시:

```json
{
  "planets": [
    { "repo_id": 1, "slot_index": 0 },
    { "repo_id": 2, "slot_index": 1 }
  ]
}
```

### Analyze

```text
GET /analyze/
GET /analyze/refresh
```

현재 `/analyze`는 mock 결과 중심이며, 실제 분석 서비스 연동이 남아 있습니다.

---

## 데이터 모델 요약

### User

- GitHub 사용자
- `github_id`, `username`, `avatar_url`, `html_url`, `access_token`

### Repository

- GitHub 레포지토리
- `github_repo_id`, `repo_name`, `html_url`, `description`, `latest_commit`
- 분석 결과: `planet_type`, `analysis_summary`, `analysis_sub1~3`

### Planet

- 사용자가 선택한 레포지토리 배치
- `repo_id`, `user_id`, `slot_index`
- `slot_index` 범위: 0~7

---

## 알려진 정리 필요 사항

- `/analyze` mock 데이터 제거 및 실제 분석 결과 연결
- `PUT /user/planets`의 replace/upsert 정책 명확화
- 중복 배치/슬롯 충돌 처리 강화
- CORS `allow_origins=["*"]`를 배포 환경에서 실제 frontend origin으로 제한
- DB migration 체계 정리
