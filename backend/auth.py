import os
import httpx
from pathlib import Path
from fastapi import APIRouter, status, Header, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# 1. GitHub 로그인 (POST /auth/login)
@router.post("/login")
async def github_login():
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email",
        status_code=status.HTTP_302_FOUND
    )

# 2. 인증 콜백 (GET /auth/callback)
@router.get("/callback")
async def github_callback(code: str):
    async with httpx.AsyncClient() as client:
        # 토큰 교환
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        access_token = token_res.json().get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="토큰 발급 실패")

        # 유저 정보 획득 (ERD 필드 추출)
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"}
        )
        u = user_res.json()
        
        # [image_7cb97e.png] USERS 테이블 구조 반영
        user_record = {
            "github_id": str(u.get("id")),      # UK: 깃허브 ID
            "username": u.get("login"),         # 유저 닉네임
            "avatar_url": u.get("avatar_url"),   # 프로필 사진 URL
            "html_url": u.get("html_url"),       # 깃허브 프로필 주소
            "access_token": access_token         # API 접속 토큰
        }

        # TODO: DB 저장 로직 (PostgreSQL) 연동 지점

        return RedirectResponse(f"{FRONTEND_URL}/login/success?token={access_token}")

# 3. 내 정보 확인 (POST /auth/me) - 명세서의 Method 준수
@router.post("/me")
async def get_my_info(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="인증 헤더가 없습니다.")
    
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": authorization}
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
        return user_res.json()

# 4. GitHub 로그아웃 (POST /auth/logout)
@router.post("/logout")
async def github_logout():
    return {"status": "success", "message": "로그아웃 성공"}

# 5. 회원 탈퇴 (DELETE /auth/user)
@router.delete("/user")
async def withdraw_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="인증 정보가 없습니다.")
    
    # TODO: DB에서 해당 유저 삭제 로직 추가
    return {"status": "success", "message": "회원 탈퇴 완료"}