<<<<<<< HEAD
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
GITHUB_TOKEN=your_personal_access_token_here

# 'your_password' 자리에 본인의 DB 비밀번호를 넣으세요. (뒤의 @는 그대로 두어야 합니다.)
# 로컬 설치 시 기본 DB와 유저는 'postgres'입니다.
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/postgres
```

### 2. 의존성 설치
```bash
cd backend
uv sync
```

## 🏃 실행 (Run)

아래 명령어로 서버를 웁니다. (최초 실행 시 테이블이 자동 생성됩니다.)
```bash
uv run uvicorn main:app --reload
```

- **API 문서 확인**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Swagger UI)

## 🐘 데이터베이스 확인 (Tip)
## ⚙️ 환경 변수 및 인증 설정 (.env)

이 프로젝트를 실행하기 위해서는 프로젝트 최상위 경로(Giterra/) 또는 `backend/` 경로에 `.env` 파일을 생성하고 아래 정보를 입력해야 합니다.

### 1. `.env` 파일 양식
```env
# [데이터 분석용 - GitHub Personal Access Token]
# 'your_password' 자리에 본인의 DB 비밀번호를 넣으세요. (뒤의 @는 그대로 두어야 합니다.)
GITHUB_TOKEN=your_personal_access_token_here
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/postgres

# [로그인용 - GitHub OAuth App]
GITHUB_CLIENT_ID=여기에_Client_ID_입력
GITHUB_CLIENT_SECRET=여기에_Client_Secret_입력
FRONTEND_URL=http://localhost:3000
```

### 2. 가이드
#### 🔑 GitHub OAuth (로그인용) 및 Token (분석용) 발급
1. **OAuth:** [GitHub Developer Settings](https://github.com/settings/developers)에서 New OAuth App 생성
   - **Callback URL**: `http://localhost:8000/auth/callback` 필수!
2. **Token:** [GitHub Personal Access Tokens](https://github.com/settings/tokens)에서 repo, user 권한 체크 후 발급

---
*(자세한 발급 단계는 기존 가이드를 참고해 주세요)*
