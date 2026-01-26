from fastapi import APIRouter
from typing import List
from app.schemas import RepoInfo
from app.services.github import get_user_repositories # 서비스 함수 호출

router = APIRouter()

@router.get("/{username}", response_model=List[RepoInfo])
async def get_user_repositories(username: str):
    # 로직은 서비스(fetch_user_repos)가 다 처리함
    return await get_user_repositories(username)