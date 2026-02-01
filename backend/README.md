# 🚀 Giterra Backend Setup Guide

Giterra 프로젝트의 백엔드 개발 환경 구축 가이드입니다.

---

## ⚙️ 환경 변수 및 인증 설정 (.env)

이 프로젝트를 실행하기 위해서는 프로젝트 루트 경로에 `.env` 파일을 생성하고 아래 정보를 입력해야 합니다.  
보안상 `.env` 파일은 Git에 포함되지 않으므로, 아래 양식을 복사하여 값을 채워주세요.

> **주의**: `backend/.env`가 아닌, 프로젝트 최상위(`GITERRA/.env`)로 저장하기를 권장합니다.

### 1. `.env` 파일 양식 (`.env.example`)
```bash
- **Python & uv**: 패키지 매니저로 `uv`를 사용합니다. ([uv 설치 가이드](https://github.com/astral-sh/uv))
- **PostgreSQL (15 버전 추천)**: 로컬 환경에 데이터베이스가 직접 설치되어 있어야 합니다.
  - [PostgreSQL 다운로드](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
```

## ⚙️ 초기 설정 (Setup)

### 1. 환경 변수 설정
`backend` 폴더 안에 `.env` 파일을 만들고 아래 코드를 복사하세요.

```env
# [데이터 분석용 - GitHub Personal Access Token]
# 'your_password' 자리에 본인의 DB 비밀번호를 넣으세요.
GITHUB_TOKEN=your_personal_access_token_here

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
