from fastapi import APIRouter
from app.schemas import AnalyzeRequest
from app.services.github import analyze_selected_repos # 로직 함수 임포트

router = APIRouter()

@router.post("/") # main에서 prefix="/analyze"를 줄 것이므로 여기는 "/"
async def analyze_selected_repos(request: AnalyzeRequest):
    return await analyze_selected_repos(request)