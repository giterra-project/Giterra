# 🚀 Giterra Backend Setup Guide

Giterra 프로젝트의 백엔드 개발 환경 구축 가이드입니다.

## 🛠️ 필수 도구 (Prerequisites)

- **Python & uv**: 패키지 매니저로 `uv`를 사용합니다. ([uv 설치 가이드](https://github.com/astral-sh/uv))
- **PostgreSQL (15 버전 추천)**: 로컬 환경에 데이터베이스가 직접 설치되어 있어야 합니다.
  - [PostgreSQL 다운로드](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)

## ⚙️ 초기 설정 (Setup)

### 1. 환경 변수 설정
`backend` 폴더 안에 `.env` 파일을 만들고 아래 코드를 복사하세요.

```env
# [데이터 분석용 - GitHub Personal Access Token]
# 'your_password' 자리에 본인의 DB 비밀번호를 넣으세요.
GITHUB_TOKEN=your_personal_access_token_here

# 'your_password' 자리에 본인의 DB 비밀번호를 넣으세요. (뒤의 @는 그대로 두어야 합니다.)
# 로컬 설치 시 기본 DB와 유저는 'postgres'입니다.
# 포스트그레 Admin을 사용해 giterra라는 새로운 데이터 베이스를 만들어서 사용해도 됩니다.
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/[DB 이름]

# [로그인용 - GitHub OAuth App]
GITHUB_CLIENT_ID=여기에_Client_ID_입력
GITHUB_CLIENT_SECRET=여기에_Client_Secret_입력
FRONTEND_URL=http://localhost:3000
```

### 2. 의존성 설치
```bash
cd backend
uv sync
```

## 🏃 실행 (Run)

아래 명령어로 서버를 실행 시킵니다. (최초 실행 시 테이블이 자동 생성됩니다.)
```bash
uv run uvicorn main:app --reload
```

- **API 문서 확인**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Swagger UI)

## 🐘 데이터베이스 확인 (Tip)
1. PostgreSQL Windows 최신버전 다운로드
2. 모두 기본세팅으로 설치, 관리자 비밀번호 설정, 마지막 stack은 설치하지 않음!
3. pgAdmin 4 실행 후 좌측 서버를 클릭하면 관리자 비밀번호 입력창이 나옴
4. Admin 로그인한 뒤 Databases 우클릭 -> Create로 새로운 데이터 베이스 생성가능
5. 기본 postreas 데이터베이스를 사용해도 되고 새로 생성해도 됨 단, 반드시 .env의 DATABASE_URL의 마지막 [DB 이름]에 알맞는 이름을 넣어서 사용

### 2. 가이드
#### 🔑 GitHub OAuth (로그인용) 및 Token (분석용) 발급
1. **OAuth:** [GitHub Developer Settings](https://github.com/settings/developers)에서 New OAuth App 생성
   - **Callback URL**: `http://localhost:8000/auth/callback` 필수!
2. **Token:** [GitHub Personal Access Tokens](https://github.com/settings/tokens)에서 repo, user 권한 체크 후 발급

---
*(자세한 발급 단계는 기존 가이드를 참고해 주세요)*

## Backend Refactoring
```text
giterra-backend/
├── pyproject.toml
├── .env                 # API KEY, DB URL 등
├── main.py              # [입구] 앱 실행 및 라우터 통합
└── app/
    ├── __init__.py
    ├── core/
    │   └── config.py    # [설정] 환경변수 로드 관리
    ├── database.py      # [DB] 세션(Session) 및 연결 설정 (engine)
    ├── models.py        # [DB] PostgreSQL 테이블 정의 (SQLAlchemy)
    ├── schemas.py       # [데이터] Pydantic 모델 (Request/Response)
    │
    ├── routers/         # API 엔드포인트를 기능별로 분리
    │   ├── __init__.py
    │   ├── auth.py      # (예: /auth/github, /auth/callback)
    │   └── analyze.py   # (예: /analyze)
    │
    └── services/        # [핵심 로직] 비즈니스 로직 분리
        ├── __init__.py
        ├── github.py    # GitHub API 호출 함수들
        └── graph.py     # LangGraph AI 로직
```