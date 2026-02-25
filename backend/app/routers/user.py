from fastapi import APIRouter, Depends
from app.database import get_session
from app.core.security import get_current_user, get_session
from app.models import User, Repository, Planet
from sqlmodel import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import BaseResponse, UserProfileData, PlanetInfo, MyRepositories, RepoListInfo, UpdatePlanetRequest, PlanetPlacementRequest, PlanetPlacementResponse

router = APIRouter()

VALID_PLANETS = {"수성", "금성", "지구", "화성", "목성", "토성", "천왕성", "해왕성"}

# ★ 핵심: response_model에 대괄호[]를 써서 알맹이 타입을 지정합니다.
@router.get("/profile", response_model=BaseResponse[UserProfileData])
async def get_user_profile(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_session)
):
    statement = (
        select(Planet)
        .where(Planet.user_id == current_user.id)
        .options(selectinload(Planet.repository)) # type: ignore
    )
    result = await db.execute(statement)
    my_planets = result.scalars().all()

    planets_data = []
    for p in my_planets:
        repo = p.repository 
        planets_data.append(
            PlanetInfo(
                repoId=repo.id, # type: ignore
                repoName=repo.repo_name,
                repoURL=f"https://github.com/{current_user.github_id}/{repo.repo_name}", # html_url이 없어서 직접 조립
                description=repo.description,
                slot=p.slot_index
            )
        )
    
    profile_data = UserProfileData(
        userId=current_user.id, # type: ignore
        username=current_user.username, 
        githubURL=current_user.html_url, # type: ignore
        planets=planets_data
    )
    
    # 2. BaseResponse에 데이터를 담아서 반환
    return BaseResponse(
        code=200,
        message="프로필 조회에 성공했습니다.",
        data=profile_data
    )

@router.get("/repos", response_model=BaseResponse[MyRepositories])
async def get_user_repositoris(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_session)
): 
    # TODO: User를 식별한 뒤 DB에서 엑세스 토큰을 가져와 레포지토리 리스트 쭉 갖고와서
    # 아래에 넣고 반환하기 + 예외처리하기
    mock_data = MyRepositories(
        repos=[
            RepoListInfo(repoName="linux-kernel", repoURL="...")
        ]
    )
    return BaseResponse(
        code=200, 
        message="레포지토리 조회에 성공했습니다.", 
        data=mock_data
    )

@router.put("/planets", response_model=BaseResponse[None])
async def update_user_planets(
    request: UpdatePlanetRequest, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_session)
): 
    slots = 0
    for repo_name in request.repos: 
        statement = select(Repository).where(
            Repository.user_id == current_user.id,
            Repository.repo_name == repo_name
        )
        result = await db.execute(statement)
        repo = result.scalars().first()
        
        # 2-2. 만약 DB에 없는 레포지토리라면 새로 생성합니다.
        if not repo:
            repo = Repository(user_id=current_user.id, repo_name=repo_name) # type: ignore
            db.add(repo)
            await db.flush() # DB에 밀어넣어서 새 repo.id를 발급받습니다.
            
        # 2-3. Planet 테이블에 행성을 하나씩 배치합니다.
        new_planet = Planet(
            user_id=current_user.id, # type: ignore
            repo_id=repo.id, # type: ignore
            slot_index=slots # 0번부터 차례대로 부여됩니다!
        )
        db.add(new_planet)
        
        slots += 1 # 다음 슬롯 번호로 이동

    await db.commit()

    return BaseResponse(
        code=200, 
        message="행성 업데이트에 성공했습니다.", 
        data=None
    )

# @router.put("/planets", response_model=PlanetPlacementResponse)
# async def update_user_planets(
#     payload: PlanetPlacementRequest,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_session)
# ):
#     errors = []
    
#     # 1. 검증 (Validation)
#     validated_placements = []
#     requested_repo_ids = [p.repo_id for p in payload.placements]
    
#     # 해당 유저가 소유한 레포지토리인지 확인
#     statement = select(Repository).where(
#         Repository.id.in_(requested_repo_ids),
#         Repository.user_id == current_user.id
#     )
#     result = await db.execute(statement)
#     owned_repos = {repo.id for repo in result.scalars().all()}
    
#     for item in payload.placements:
#         # repo_id 권한 확인
#         if item.repo_id not in owned_repos:
#             errors.append({
#                 "field": "repo_id",
#                 "value": item.repo_id,
#                 "reason": "Repository not found or access denied"
#             })
#             continue
            
#         # slot_index 범위 확인 (0~7)
#         if not (0 <= item.slot_index <= 7):
#             errors.append({
#                 "field": "slot_index",
#                 "value": item.slot_index,
#                 "reason": "slot_index must be between 0 and 7"
#             })
            
#         # planet_type 유효성 확인
#         if item.planet_type not in VALID_PLANETS:
#             errors.append({
#                 "field": "planet_type",
#                 "value": item.planet_type,
#                 "reason": "invalid planet_type"
#             })
            
#     if errors:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail={"code": 400, "message": "validation failed", "errors": errors}
#         )
    
#     # 2. DB 반영 (Atomic)
#     try:
#         if payload.mode == "replace":
#             # 기존 배치 삭제 (해당 유저의 모든 배치)
#             delete_stmt = delete(Planet).where(Planet.user_id == current_user.id)
#             await db.execute(delete_stmt)
            
#             # 새로운 배치 추가
#             for item in payload.placements:
#                 new_placement = Planet(
#                     user_id=current_user.id,
#                     repo_id=item.repo_id,
#                     slot_index=item.slot_index,
#                     planet_type=item.planet_type
#                 )
#                 db.add(new_placement)
        
#         await db.commit()
#     except Exception as e:
#         await db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Database error: {str(e)}"
#         )
        
#     # 결과 반환
#     return PlanetPlacementResponse(
#         code=200,
#         message="placements updated",
#         data={"placements": [item.dict() for item in payload.placements]}
#     )