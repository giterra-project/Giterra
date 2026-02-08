from typing import Optional

import httpx
from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import User


def _extract_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")

    value = authorization.strip()
    parts = value.split(" ")

    if len(parts) == 1:
        return parts[0]

    if len(parts) == 2 and parts[0].lower() in {"token", "bearer"}:
        return parts[1]

    raise HTTPException(status_code=401, detail="Invalid Authorization header format")


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_session),
) -> User:
    token = _extract_token(authorization)

    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {token}"},
        )

    if user_res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid access token")

    github_user = user_res.json()
    github_id = str(github_user.get("id"))

    if not github_id:
        raise HTTPException(status_code=401, detail="Failed to resolve GitHub user")

    statement = select(User).where(User.github_id == github_id)
    result = await db.execute(statement)
    db_user = result.scalars().first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Please login through Giterra first")

    if db_user.access_token != token:
        db_user.access_token = token
        await db.commit()
        await db.refresh(db_user)

    return db_user
