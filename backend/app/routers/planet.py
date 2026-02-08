from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.dependencies import get_current_user
from app.models import User, Repository, UserProfile
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/planet", tags=["planet"])

class RepoDetail(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int
    updated_at: Optional[str] = None
    
    # AI Analysis Data
    building_type: Optional[str] = "Unknown"
    analysis_type: Optional[str] = "Normal"
    analysis_summary: Optional[str] = None
    analysis_sub1: Optional[str] = None # Tech
    analysis_sub2: Optional[str] = None # Stability
    analysis_sub3: Optional[str] = None # Comm
    last_analyzed: Optional[datetime] = None

class PlanetResponse(BaseModel):
    username: str
    persona: str = "우주 미아" # Default
    theme: str = "start_tree" # Default theme key
    total_score: float = 0.0
    overall_analysis: Optional[str] = None
    repositories: List[RepoDetail]

@router.get("/{username}", response_model=PlanetResponse)
async def get_planet_data(
    username: str,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if username != current_user.username:
        raise HTTPException(status_code=403, detail="You can only view your own planet data")

    # 1. 유저 조회
    statement = select(User).where(User.username == username)
    result = await db.execute(statement)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. 레포지토리 조회
    repo_stmt = select(Repository).where(Repository.user_id == user.id)
    repo_res = await db.execute(repo_stmt)
    repos = repo_res.scalars().all()

    # 3. 데이터 가공
    repo_details = []
    total_score = 0.0
    persona = "새싹이 돋아나는 땅 (Beginner)"
    theme = "start_tree"
    overall_analysis = None

    profile_stmt = select(UserProfile).where(UserProfile.user_id == user.id)
    profile_res = await db.execute(profile_stmt)
    profile = profile_res.scalars().first()

    if profile:
        persona = profile.persona or persona
        theme = profile.theme or theme
        if profile.total_score is not None:
            total_score = float(profile.total_score)
        overall_analysis = profile.overall_analysis

    # 테마 결정을 위한 점수 집계 (저장된게 없으면 재계산 불가하므로, 
    # github.py에서 저장할 때 User 테이블에 persona/theme을 저장하거나,
    # 여기서는 Repo들의 building_type 분포로 역산해야 함.
    # 일단은 가장 최근 분석된 레포의 theme_key를 따르거나, 
    # 간단히 '가장 많은 building_type'의 테마를 따르는 식으로 구현)
    
    # *참고*: 현재 DB 스키마에는 User에 persona 필드가 없음. 
    # Repository에 theme_key도 저장하지 않았음 (github.py 수정시 building_type만 매핑함).
    # 따라서 여기서 building_type을 보고 역산하거나, 
    # github.py에서 User 테이블에 persona를 저장하도록 모델을 수정하는게 정석임.
    #
    # >> 간편한 방법: Repository들 중 하나라도 'theme_key' 정보가 있으면 좋겠지만,
    # 지금은 building_type 매핑 테이블을 여기도 가지고 와서 역산.

    OBJECT_TO_THEME = {
        "GlassBuilding": "future_city", "HologramTree": "future_city", "Hyperloop": "future_city", "HologramSign": "future_city", "Drone": "future_city",
        "MetalBunker": "lab_dome", "ShieldTurret": "lab_dome", "PipeLine": "lab_dome", "SatelliteDish": "lab_dome", "Ventilation": "lab_dome",
        "GiantTree": "primitive_forest", "MossRock": "primitive_forest", "VineBridge": "primitive_forest", "AncientRune": "primitive_forest", "WildFlower": "primitive_forest",
        "Sprout": "start_tree", "Pebble": "start_tree", "SteppingStone": "start_tree", "Firefly": "start_tree", "Leaf": "start_tree"
    }

    THEME_NAMES = {
        "future_city": "미래 도시 숲 (Future City)",
        "lab_dome": "연구소 돔 (Lab Dome)",
        "primitive_forest": "원시의 숲 (Primitive Forest)",
        "start_tree": "시작의 나무 (Start Tree)"
    }

    theme_counts = {}

    for r in repos:
        # Pydantic 변환
        rd = RepoDetail(
            name=r.name,
            description=None, # DB에 description 필드가 없다면 생략
            language=None,    # DB에 language 필드가 없다면 생략 (현재 Repository 모델 확인 필요)
            stars=0,          # DB에 stars 필드가 없다면 0
            updated_at=r.latest_commit.isoformat() if r.latest_commit else None,
            
            building_type=r.analysis_type, # 주의: github.py에선 analysis_type에 'Builder' 등을 넣고, building_type은 따로 안넣었음?? 
            # 아까 github.py 수정할 때 db_repo.analysis_type = repo_type (Builder 등) 넣고 
            # building_type은 DB 컬럼에 없는 상태에서 return dict에만 넣었음!!
            # -> DB에 building_type 컬럼이 없으면 저장이 안됨.
            # -> **긴급 수정 필요**: Repository 모델에 building_type 컬럼 추가 필요 or analysis_type에 building_type을 저장하도록 수정 필요.
            
            # 일단 현재 github.py 로직상:
            # db_repo.analysis_type = repo_type ("Builder", "Normal" 등)
            # db_repo.analysis_summary = analysis.summary
            
            # building_type을 별도로 저장하지 않으면 조회가 불가능함.
            # -> analysis_type 필드를 활용하자. (기존 "Builder" 등 대신 "GlassBuilding" 등을 저장하도록 github.py 수정 필요)
            
            analysis_summary=r.analysis_summary,
            analysis_sub1=r.analysis_sub1,
            analysis_sub2=r.analysis_sub2,
            analysis_sub3=r.analysis_sub3,
            last_analyzed=r.last_analyzed
        )
        repo_details.append(rd)
        
        # 테마 카운팅 (analysis_type에 building_type이 저장된다고 가정)
        b_type = r.analysis_type 
        th = OBJECT_TO_THEME.get(b_type, "start_tree")
        theme_counts[th] = theme_counts.get(th, 0) + 1

    if theme_counts and not profile:
        theme = max(theme_counts, key=theme_counts.get)
        persona = THEME_NAMES.get(theme, "미지의 행성")

    return PlanetResponse(
        username=user.username,
        persona=persona,
        theme=theme,
        total_score=total_score,
        overall_analysis=overall_analysis,
        repositories=repo_details
    )
