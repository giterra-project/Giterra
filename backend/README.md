## ⚙️ 환경 변수 설정 (.env)

이 프로젝트를 실행하기 위해서는 프로젝트 루트 경로에 `.env` 파일을 생성하고 아래 정보를 입력해야 합니다.  
보안상 `.env` 파일은 Git에 포함되지 않으므로, 아래 양식을 복사하여 값을 채워주세요.

---
### `backend/.env`가 아닌, `GITERRA/.env`로 저장하십시오.
---

### 1. `.env` 파일 양식
```bash
# [로그인용 - GitHub OAuth App]
GITHUB_CLIENT_ID=여기에_Client_ID_입력
GITHUB_CLIENT_SECRET=여기에_Client_Secret_입력
FRONTEND_URL=http://localhost:3000

# [데이터 분석용 - GitHub Personal Access Token]
GITHUB_TOKEN=여기에_ghp_토큰_입력
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