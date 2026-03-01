from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.schemas import AnalyzeRequest, BaseResponse, RepositoryResult, AnalyzeResult
from app.services.github import analyze_selected_repos, refresh_analyze_repos
from app.core.security import get_current_user
from app.models import User

router = APIRouter()

@router.get("/", response_model=BaseResponse[AnalyzeResult])
async def perform_analysis(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 지금 analyze_selected_repos는 행성 타입만 뱉고 있음
    # TODO: 따라서 랭그래프결과와 행성 타입을 모두 종합해서 뱉도록 만들어야함
    planet_type = await analyze_selected_repos(db, current_user)
    
    mock_repo = RepositoryResult(
        repoName="linux-kernel", 
        repoURL="https://www.naver.com", 
        planetType="Type", 
        repoSummary="use UNIX", 
        aspect_1="CSS", 
        aspect_2="IS", 
        aspect_3="AWESOME"
    )
    mock_data = AnalyzeResult(
        summary="Linux", 
        repos=[mock_repo]
    )

    return BaseResponse(
        code=200, 
        message="분석을 성공적으로 마쳤습니다.", 
        data=mock_data
    )

@router.get("/refresh", response_model=BaseResponse[AnalyzeResult])
async def refresh_analysis(
    request: AnalyzeRequest, 
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    result = refresh_analyze_repos(db, current_user)
    mock_repo = RepositoryResult(
        repoName="linux-kernel", 
        repoURL="https://www.naver.com", 
        planetType="Type", 
        repoSummary="use UNIX", 
        aspect_1="CSS", 
        aspect_2="IS", 
        aspect_3="AWESOME"
    )
    mock_data = AnalyzeResult(
        summary="Linux", 
        repos=[mock_repo]
    )

    return BaseResponse(
        code=200, 
        message="재분석을 성공적으로 마쳤습니다.", 
        data=mock_data
    )

@router.get("search/{username}", response_model=BaseResponse[AnalyzeResult])
async def search_analyze_repos(
    username: str, 
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
): 
    # TODO: 깃허브 API로 username가 DB에 등록해놓은 레포지토리를 분석 후 결과 리턴
    result = refresh_analyze_repos(db, current_user)
    mock_repo = RepositoryResult(
        repoName="linux-kernel", 
        repoURL="https://www.naver.com", 
        planetType="Type", 
        repoSummary="use UNIX", 
        aspect_1="CSS", 
        aspect_2="IS", 
        aspect_3="AWESOME"
    )
    mock_data = AnalyzeResult(
        summary="Linux", 
        repos=[mock_repo]
    )

    return BaseResponse(
        code=200, 
        message="검색한 사용자의 분석결과를 성공적으로 가져왔습니다.", 
        data=mock_data
    )