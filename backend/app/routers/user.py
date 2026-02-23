from fastapi import APIRouter
from app.database import get_session
from app.models import User
from app.schemas import BaseResponse, UserProfileData, PlanetInfo, MyRepositories 

router = APIRouter()

# ★ 핵심: response_model에 대괄호[]를 써서 알맹이 타입을 지정합니다.
@router.get("/profile", response_model=BaseResponse[UserProfileData])
async def get_user_profile():
    
    # 1. 알맹이(Data) 데이터 준비
    mock_data = UserProfileData(
        userId=1,
        username="Linus Torvalds",
        githubURL="https://github.com/torvalds",
        planets=[
            PlanetInfo(repoId=101, repoName="linux-kernel", repoURL="...")
        ]
    )
    
    # 2. BaseResponse에 데이터를 담아서 반환
    return BaseResponse(
        code=200,
        message="프로필 조회에 성공했습니다.",
        data=mock_data
    )

@router.get("/repos", response_model=BaseResponse[MyRepositories])
async def get_user_repositoris(): 
    # TODO: User를 식별한 뒤 DB에서 엑세스 토큰을 가져와 레포지토리 리스트 쭉 갖고와서
    # 아래에 넣고 반환하기 + 예외처리하기
    mock_data = MyRepositories(
        planets=[
            PlanetInfo(repoId=101, repoName="linux-kernel", repoURL="...")
        ]
    )
    return BaseResponse(
        code=200, 
        message="레포지토리 조회에 성공했습니다.", 
        data=mock_data
    )

@router.put("/planets", response_model=BaseResponse[None])
async def update_user_planets(): 
    # TODO: DB에 업데이트 하기
    return BaseResponse(
        code=200, 
        message="행성 업데이트에 성공했습니다.", 
        data=None
    )