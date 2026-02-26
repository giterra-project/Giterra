from fastapi import APIRouter, Depends
from app.database import get_session
from app.core.security import get_current_user, get_session
from app.core.config import settings
from app.models import User, Repository, Planet
from app.services.github import get_user_repositories
from sqlmodel import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import BaseResponse, UserProfileData, PlanetInfo, MyRepositories, RepoListInfo, PlanetPlacementRequest
from datetime import datetime

router = APIRouter()

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
                repoURL=repo.html_url, 
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
    repos = []

    github_repos = await get_user_repositories(
        username=current_user.username, 
        db=db
    )
    result_id = []
    for repo in github_repos: 
        result_id.append(repo.repo_id)
        statement = select(Repository).where(
            Repository.user_id == current_user.id,
            Repository.github_repo_id == repo.repo_id
        )
        result = await db.execute(statement)
        existing_repo = result.scalars().first()

        latest_update_date = None
        if repo.updated_at: 
            latest_update_date = datetime.fromisoformat(repo.updated_at.replace('Z', '+00:00'))
        if existing_repo:
            # [UPDATE] 이미 존재한다면 변경될 수 있는 정보들만 덮어씌웁니다.
            existing_repo.repo_name = repo.name
            existing_repo.html_url = repo.url
            existing_repo.description = repo.description
            existing_repo.latest_commit = latest_update_date
            # 변경된 객체는 db에 별도로 add() 할 필요 없이 commit() 때 자동 반영됩니다.
        else:
            # [INSERT] 없다면 새로 생성해서 장바구니(Session)에 담습니다.
            new_repo = Repository(
                github_repo_id=repo.repo_id,
                user_id=current_user.id, # type: ignore
                repo_name=repo.name,
                html_url=repo.url,
                description=repo.description,
                latest_commit=latest_update_date
            )
            db.add(new_repo)
        
        repos.append(RepoListInfo(
            repoId=repo.repo_id, 
            repoName=repo.name, 
            repoURL=repo.url, 
            description=repo.description
        ))

    if result_id: 
        statement = select(Repository).where(
            Repository.user_id == current_user.id, 
            Repository.repo_id.notin_(result_id) # type: ignore
        )
        repos_to_delete = (await db.execute(statement)).scalars().all()

        if repos_to_delete: 
            await db.execute(
                delete(Planet).where(Planet.repo_id.in_(repos_to_delete)) # type: ignore
            )

            await db.execute(
                delete(Repository).where(Repository.id.in_(repos_to_delete)) # type: ignore
            )

    await db.commit()

    data = MyRepositories(
        repos=repos
    )
    return BaseResponse(
        code=200, 
        message="레포지토리 조회에 성공했습니다.", 
        data=data
    )

@router.put("/planets", response_model=BaseResponse[None])
async def update_user_planets(
    payload: PlanetPlacementRequest, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_session)
): 
    for place in payload.placements: 
        statement = select(Repository).where(
            Repository.id == place.repo_id,
        )
        result = await db.execute(statement)
        repo = result.scalars().first()
        
        # 2-2. 만약 DB에 없는 레포지토리라면 오류메세지를 반환합니다.
        if not repo:
            return BaseResponse(
                code=404, 
                message=f"레포지토리 ID: {place.repo_id} 가 존재하지 않습니다.", 
                data=None
            )
        
        if repo.user_id != current_user.id: 
            return BaseResponse(
                code=403, 
                message=f"레포지토리 ID: {place.repo_id} 를 소유하고 있지 않습니다.", 
                data=None
            )
        
        if not (0 <= place.slot_index <= 7):
            return BaseResponse(
                code=400, 
                message=f"레포지토리 ID: {place.repo_id} 의 슬롯이 유효하지 않습니다.", 
                data=None
            )
            
        # 2-3. Planet 테이블에 행성을 하나씩 배치합니다.
        new_planet = Planet(
            user_id=current_user.id, # type: ignore
            repo_id=repo.id, # type: ignore
            slot_index=place.slot_index # 0번부터 차례대로 부여됩니다!
        )
        db.add(new_planet)
        

    await db.commit()

    return BaseResponse(
        code=200, 
        message="행성 업데이트에 성공했습니다.", 
        data=None
    )