from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.schemas import AnalyzeRequest
from app.services.github import analyze_selected_repos
from app.core.security import get_current_user
from app.models import User

router = APIRouter()

@router.post("/")
async def perform_analysis(
    request: AnalyzeRequest, 
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # JWT를 통해 인증된 사용자임을 보장함
    return await analyze_selected_repos(request, db)