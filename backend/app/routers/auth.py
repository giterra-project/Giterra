import httpx
from fastapi import APIRouter, status, Header, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.config import settings
from app.database import get_session
from app.models import User

router = APIRouter()

GITHUB_CLIENT_ID = settings.GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET = settings.GITHUB_CLIENT_SECRET
FRONTEND_URL = settings.FRONTEND_URL

# 1. GitHub 로그인 (POST /auth/login)
@router.get("/login")
async def github_login():
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email",
        status_code=status.HTTP_302_FOUND
    )

# 2. 인증 콜백 (GET /auth/callback)
@router.get("/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_session)):
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
        github_id = str(u.get("id"))
        
        # DB 저장 로직 (Upsert)
        statement = select(User).where(User.github_id == github_id)
        result = await db.execute(statement)
        db_user = result.scalars().first()

        if db_user:
            # 정보 업데이트
            db_user.username = u.get("login")
            db_user.avatar_url = u.get("avatar_url")
            db_user.html_url = u.get("html_url")
            db_user.access_token = access_token
        else:
            # 신규 생성
            db_user = User(
                github_id=github_id,
                username=u.get("login"),
                avatar_url=u.get("avatar_url"),
                html_url=u.get("html_url"),
                access_token=access_token
            )
            db.add(db_user)
        
        await db.commit()
        await db.refresh(db_user)

        return RedirectResponse(f"{FRONTEND_URL}/login/callback?token={access_token}")

# 3. 내 정보 확인 (POST /auth/me) - 명세서의 Method 준수
@router.get("/me")
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
async def withdraw_user(authorization: str = Header(None), db: AsyncSession = Depends(get_session)):
    if not authorization:
        raise HTTPException(status_code=401, detail="인증 정보가 없습니다.")
    
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": authorization}
        )
        if user_res.status_code != 200:
             raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
        
        u = user_res.json()
        github_id = str(u.get("id"))

        statement = select(User).where(User.github_id == github_id)
        result = await db.execute(statement)
        db_user = result.scalars().first()

        if db_user:
            await db.delete(db_user)
            await db.commit()
            return {"status": "success", "message": "회원 탈퇴 완료"}
        else:
            raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")
