from fastapi import APIRouter, Depends
from app.database import get_session
from app.core.security import get_current_user, get_session
from app.models import User, Repository, Planet
from sqlmodel import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import BaseResponse, UserProfileData, PlanetInfo, MyRepositories, RepoListInfo, UpdatePlanetRequest

router = APIRouter()

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