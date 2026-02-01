from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.schemas import AnalyzeRequest
from app.services.github import analyze_selected_repos # 로직 함수 임포트

router = APIRouter()

@router.post("/") # main에서 prefix="/analyze"를 줄 것이므로 여기는 "/"
async def perform_analysis(request: AnalyzeRequest, db: AsyncSession = Depends(get_session)):
    return await analyze_selected_repos(request, db)