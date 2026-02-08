from fastapi import APIRouter, Depends
from typing import List
from app.dependencies import get_current_user
from app.models import User
from app.schemas import RepoInfo
from app.services.github import get_user_repositories, get_repo_commits # 서비스 함수 호출

router = APIRouter()

@router.get("/{username}/{repo_name}/commits")
async def read_repository_commits(
    username: str,
    repo_name: str,
    _: User = Depends(get_current_user),
):
    return await get_repo_commits(username, repo_name)

@router.get("/{username}", response_model=List[RepoInfo])
async def read_user_repositories(
    username: str,
    _: User = Depends(get_current_user),
):
    # 로직은 서비스(get_user_repositories)가 다 처리함
    return await get_user_repositories(username)
