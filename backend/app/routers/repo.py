from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import RepoInfo
from app.services.github import get_user_repositories
from app.database import get_session
from app.core.security import get_current_user
from app.models import User

router = APIRouter()

@router.get("/{username}", response_model=List[RepoInfo])
async def read_user_repositories(
    username: str, 
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # JWT를 통해 인증된 사용자이며, 서비스 코드에서 DB의 토큰을 꺼내 쓰도록 db를 전달함
    return await get_user_repositories(username, db)