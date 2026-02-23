import httpx
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, status, Header, HTTPException, Depends
from app.core.security import create_access_token, get_current_user
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

# CSRF state 저장소 (서버 메모리) { state: 만료 시각 }
# 소규모 서비스에서 충분. 대규모 시 Redis로 교체 가능.
_state_store: dict[str, datetime] = {}
STATE_EXPIRE_MINUTES = 10  # state 유효 시간

# 1. GitHub 로그인 (GET /auth/login)
@router.get("/login")
async def github_login():
    # CSRF 방지: 무작위 state 생성 후 저장소에 등록 (유효 10분)
    state = secrets.token_urlsafe(32)
    _state_store[state] = datetime.utcnow() + timedelta(minutes=STATE_EXPIRE_MINUTES)
    
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email&state={state}",
        status_code=status.HTTP_302_FOUND
    )

# 2. 인증 콜백 (GET /auth/callback)
@router.get("/callback")
async def github_callback(code: str, state: str | None = None, db: AsyncSession = Depends(get_session)):
    # CSRF state 검증
    if not state or state not in _state_store:
        raise HTTPException(status_code=400, detail="유효하지 않은 state입니다. 다시 로그인해 주세요.")
    
    if datetime.utcnow() > _state_store[state]:
        del _state_store[state]  # 만료된 state 정리
        raise HTTPException(status_code=400, detail="로그인 요청이 만료되었습니다. 다시 시도해 주세요.")
    
    # 검증 완료 후 state 삭제 (일회용)
    del _state_store[state]
    
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

        # 4. Giterra 자체 JWT 발급 (github_id를 sub로 사용)
        giterra_jwt = create_access_token(data={"sub": db_user.github_id})

        # 프론트엔드로 리다이렉트 (GitHub 토큰 대신 JWT 전달)
        return RedirectResponse(f"{FRONTEND_URL}/login/callback?token={giterra_jwt}")

# 3. 내 정보 확인 (GET /auth/me)
@router.get("/me")
async def get_my_info(current_user: User = Depends(get_current_user)):
    """보안 요원(Depends)이 검증해준 유저 정보를 바로 반환"""
    return {
        "id": current_user.github_id,
        "username": current_user.username,
        "avatar_url": current_user.avatar_url,
        "html_url": current_user.html_url
    }

# 4. GitHub 로그아웃 (POST /auth/logout)
@router.post("/logout")
async def github_logout(current_user: User = Depends(get_current_user)):
    return {
        "status": "success", 
        "message": f"{current_user.username}님 로그아웃 성공"
    }

# 5. 회원 탈퇴 (DELETE /auth/user)
@router.delete("/user")
async def withdraw_user(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_session)
):
    """현재 로그인한 유저를 DB에서 삭제"""
    await db.delete(current_user)
    await db.commit()
    return {"status": "success", "message": "회원 탈퇴 완료"}
