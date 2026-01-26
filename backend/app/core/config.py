import os
from dotenv import load_dotenv
from pathlib import Path

# .env 로드 (경로 문제 방지를 위해 절대 경로 사용 추천)
BASE_DIR = Path(__file__).resolve().parent.parent.parent # 프로젝트 루트 찾기
load_dotenv(dotenv_path=BASE_DIR / ".env")

class Settings:
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # 공통 헤더
    @property
    def GITHUB_HEADERS(self):
        return {
            "Authorization": f"token {self.GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }

settings = Settings()