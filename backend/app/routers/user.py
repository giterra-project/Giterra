from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, delete
from app.database import get_session
from app.models import User, Repository, Placement
from app.schemas import PlanetPlacementRequest, PlanetPlacementResponse
from app.core.security import get_current_user
from typing import List

router = APIRouter()

VALID_PLANETS = {"수성", "금성", "지구", "화성", "목성", "토성", "천왕성", "해왕성"}

@router.put("/planets", response_model=PlanetPlacementResponse)
async def update_user_planets(
    payload: PlanetPlacementRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    errors = []
    
    # 1. 검증 (Validation)
    validated_placements = []
    requested_repo_ids = [p.repo_id for p in payload.placements]
    
    # 해당 유저가 소유한 레포지토리인지 확인
    statement = select(Repository).where(
        Repository.id.in_(requested_repo_ids),
        Repository.user_id == current_user.id
    )
    result = await db.execute(statement)
    owned_repos = {repo.id for repo in result.scalars().all()}
    
    for item in payload.placements:
        # repo_id 권한 확인
        if item.repo_id not in owned_repos:
            errors.append({
                "field": "repo_id",
                "value": item.repo_id,
                "reason": "Repository not found or access denied"
            })
            continue
            
        # slot_index 범위 확인 (0~7)
        if not (0 <= item.slot_index <= 7):
            errors.append({
                "field": "slot_index",
                "value": item.slot_index,
                "reason": "slot_index must be between 0 and 7"
            })
            
        # planet_type 유효성 확인
        if item.planet_type not in VALID_PLANETS:
            errors.append({
                "field": "planet_type",
                "value": item.planet_type,
                "reason": "invalid planet_type"
            })
            
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "validation failed", "errors": errors}
        )
    
    # 2. DB 반영 (Atomic)
    try:
        if payload.mode == "replace":
            # 기존 배치 삭제 (해당 유저의 모든 배치)
            delete_stmt = delete(Placement).where(Placement.user_id == current_user.id)
            await db.execute(delete_stmt)
            
            # 새로운 배치 추가
            for item in payload.placements:
                new_placement = Placement(
                    user_id=current_user.id,
                    repo_id=item.repo_id,
                    slot_index=item.slot_index,
                    planet_type=item.planet_type
                )
                db.add(new_placement)
        
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
    # 결과 반환
    return PlanetPlacementResponse(
        code=200,
        message="placements updated",
        data={"placements": [item.dict() for item in payload.placements]}
    )
