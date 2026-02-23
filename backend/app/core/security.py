import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.database import get_session
from app.models import User

# Swagger UI와 프론트엔드에서 사용할 헤더 이름 정의
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Giterra 전용 JWT 발급"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    authorization: str = Depends(api_key_header),
    db: AsyncSession = Depends(get_session)
) -> User:
    """JWT를 검증하고 현재 로그인한 유저 객체를 반환하는 의존성 함수"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 헤더가 없습니다.",
        )

    # "token " 또는 "Bearer " 접두사 제거 로직
    token = authorization
    if authorization.startswith(("token ", "Bearer ")):
        token = authorization.split(" ")[1]

    try:
        # JWT 해독
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        github_id: str = payload.get("sub")
        if github_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다. (ID 없음)",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰이거나 만료되었습니다.",
        )

    # DB에서 해당 유저 조회
    statement = select(User).where(User.github_id == github_id)
    result = await db.execute(statement)
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="존재하지 않는 사용자입니다.",
        )
    
    return user
