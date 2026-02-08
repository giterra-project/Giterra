from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.dependencies import get_current_user
from app.models import User
from app.schemas import AnalyzeRequest, AnalyzeDirectRequest, DirectAnalyzeResponse
from app.services.github import analyze_selected_repos, analyze_repos_direct # 로직 함수 임포트

router = APIRouter()

@router.post("/") # main에서 prefix="/analyze"를 줄 것이므로 여기는 "/"
async def perform_analysis(
    request: AnalyzeRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if request.github_username != current_user.username:
        raise HTTPException(status_code=403, detail="You can only analyze your own repositories")
    return await analyze_selected_repos(request, db)


@router.post("/direct", response_model=DirectAnalyzeResponse)
async def perform_direct_analysis(
    request: AnalyzeDirectRequest,
    _: User = Depends(get_current_user),
):
    return await analyze_repos_direct(request)
