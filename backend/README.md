# 🚀 Giterra Backend Setup Guide

Giterra 프로젝트의 백엔드 개발 환경 구축 가이드입니다.

---

## ⚙️ 환경 변수 및 인증 설정 (.env)

이 프로젝트를 실행하기 위해서는 프로젝트 루트 경로에 `.env` 파일을 생성하고 아래 정보를 입력해야 합니다.  
보안상 `.env` 파일은 Git에 포함되지 않으므로, 아래 양식을 복사하여 값을 채워주세요.

> **주의**: `backend/.env`가 아닌, 프로젝트 최상위(`GITERRA/.env`)로 저장하기를 권장합니다.

### 1. `.env` 파일 양식 (`.env.example`)
```bash
# [로그인용 - GitHub OAuth App]
GITHUB_CLIENT_ID=여기에_Client_ID_입력
GITHUB_CLIENT_SECRET=여기에_Client_Secret_입력
FRONTEND_URL=http://localhost:3000

# [데이터 분석용 - GitHub Personal Access Token]
# 'your_password' 자리에 본인의 DB 비밀번호를 넣으세요.
GITHUB_TOKEN=여기에_ghp_토큰_입력
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/postgres
```

### 2. 토큰 발급 및 설정 방법

#### 🔑 1) GitHub OAuth (로그인용)
1. **GitHub Developer Settings** 접속
   - [Settings > Developer settings > OAuth Apps](https://github.com/settings/developers) 로 이동
2. **New OAuth App** 클릭
3. 아래와 같이 설정 입력:
   - **Application name**: `Giterra` (혹은 원하는 이름)
   - **Homepage URL**: `http://localhost:8000` (백엔드 주소)
   - **Authorization callback URL**: `http://localhost:8000/auth/callback` (**중요!** 정확히 입력해야 함)
4. 생성 완료 후 **Client ID**를 복사하여 `.env` 파일의 `GITHUB_CLIENT_ID`에 붙여넣기
5. **Generate a new client secret** 버튼을 눌러 **Client Secret**을 생성하고, 복사하여 `.env` 파일의 `GITHUB_CLIENT_SECRET`에 붙여넣기

#### 📊 2) GitHub Personal Access Token (데이터 분석용)

1. **Personal Access Tokens** 접속
   - [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens) 로 이동
2. **Generate new token (classic)** 클릭
3. **Note**에 용도 입력 (예: `Giterra Analysis`)
4. **Expiration** 설정 (테스트용이면 `No expiration` 혹은 `30 days` 권장)
5. **Select scopes (권한 설정)** - 아래 항목 **필수 체크**:
   - [x] **repo** (Full control of private repositories) : 비공개 레포지토리 분석용
   - [x] **user** (Update all user data) : 사용자 프로필 조회용
6. 생성된 `ghp_...` 로 시작하는 토큰을 복사하여 `.env` 파일의 `GITHUB_TOKEN`에 붙여넣기

#### 🖥️ 3) Frontend URL
- 로컬 테스트 시: `http://localhost:3000` 을 그대로 사용하면 됩니다.
- 배포 시: 실제 배포된 프론트엔드 도메인 주소로 변경해주세요.

---

## 🛠️ 개발 환경 구축 및 실행

### 1. 필수 도구
- **Python & uv**: 패키지 매니저로 `uv`를 사용합니다. ([uv 설치 가이드](https://github.com/astral-sh/uv))
- **PostgreSQL (15 버전 추천)**: 로컬 환경에 데이터베이스가 직접 설치되어 있어야 합니다.
  - [PostgreSQL 다운로드](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)

### 2. 의존성 설치 및 실행
```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```
- **API 문서 확인**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Swagger UI)
- 서버 최초 실행 시 데이터베이스 테이블이 자동 생성됩니다.

### 3. 🐘 데이터베이스 확인 (Tip)
VS Code의 전용 확장 프로그램인 **SQLTools**를 설치하면 DB 내부를 한눈에 볼 수 있습니다.
- 설치: `SQLTools`, `SQLTools PostgreSQL/Cockroach Driver`
- 연결 정보: `.env`에 적은 정보를 그대로 입력하세요.
