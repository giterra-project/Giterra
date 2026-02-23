import os
from dotenv import load_dotenv
from pathlib import Path

# .env 로드 (backend/.env 또는 프로젝트 루트/.env 검색)
BASE_DIR = Path(__file__).resolve().parent.parent.parent # backend/ 폴더
env_paths = [
    BASE_DIR / ".env",          # backend/.env
    BASE_DIR.parent / ".env"    # 프로젝트루트/.env
]

env_loaded = False
for path in env_paths:
    if path.exists():
        load_dotenv(dotenv_path=path)
        print(f"✅ 환경 변수 로드 성공: {path}")
        env_loaded = True
        break

if not env_loaded:
    print("⚠️ 경고: .env 파일을 찾을 수 없습니다.")

class Settings:
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # JWT Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fallback_secret_key_for_dev")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # 공통 헤더
    @property
    def GITHUB_HEADERS(self):
        return {
            "Authorization": f"token {self.GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }

settings = Settings()