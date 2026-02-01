import asyncio
import json
import os
import sys
from datetime import datetime

# Windows 호환성 설정
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session
from app.models import User, Repository
from sqlmodel import select

async def dump_data():
    async with async_session() as session:
        # 1. 모든 유저와 레포지토리 정보 가져오기
        user_result = await session.execute(select(User))
        users = user_result.scalars().all()
        
        repo_result = await session.execute(select(Repository))
        repos = repo_result.scalars().all()
        
        # 2. JSON 직렬화를 위한 데이터 변환 (datetime 처리 포함)
        data = {
            "users": [
                {
                    "github_id": u.github_id,
                    "username": u.username,
                    "avatar_url": u.avatar_url,
                    "html_url": u.html_url
                } for u in users
            ],
            "repositories": [
                {
                    "user_username": [u.username for u in users if u.id == r.user_id][0],
                    "name": r.name,
                    "analysis_type": r.analysis_type,
                    "analysis_summary": r.analysis_summary,
                    "latest_commit": r.latest_commit.isoformat() if r.latest_commit else None,
                    "last_analyzed": r.last_analyzed.isoformat() if r.last_analyzed else None
                } for r in repos
            ]
        }
        
        # 3. 파일로 저장
        output_path = os.path.join("data", "seed_data.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ 기껏 모은 {len(repos)}개의 행성 데이터를 {output_path}에 저장 완료했습니다!")

if __name__ == "__main__":
    asyncio.run(dump_data())
