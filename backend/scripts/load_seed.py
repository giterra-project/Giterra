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

async def load_data():
    seed_path = os.path.join("data", "seed_data.json")
    if not os.path.exists(seed_path):
        print("❌ 시드 데이터 파일이 없습니다! 먼저 dump_seed.py를 실행하세요.")
        return

    with open(seed_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    async with async_session() as session:
        print("🚀 데이터 로딩 시작...")
        
        # 1. 유저 로딩
        username_to_id = {}
        for u_data in data["users"]:
            # 이미 있는 유저는 스킵
            statement = select(User).where(User.github_id == u_data["github_id"])
            existing = await session.execute(statement)
            db_user = existing.scalars().first()
            
            if not db_user:
                db_user = User(**u_data)
                session.add(db_user)
                await session.flush() # ID를 얻기 위해 flush
            
            username_to_id[db_user.username] = db_user.id
        
        # 2. 레포지토리 로딩
        for r_data in data["repositories"]:
            target_user_id = username_to_id.get(r_data["user_username"])
            if not target_user_id: continue
            
            # 이미 있는 레포는 스킵 (유저ID와 이름 조합으로 체크)
            statement = select(Repository).where(
                Repository.user_id == target_user_id,
                Repository.name == r_data["name"]
            )
            existing_repo = await session.execute(statement)
            if existing_repo.scalars().first():
                continue
                
            # 데이터 가공
            user_username = r_data.pop("user_username")
            if r_data["latest_commit"]:
                r_data["latest_commit"] = datetime.fromisoformat(r_data["latest_commit"])
            if r_data["last_analyzed"]:
                r_data["last_analyzed"] = datetime.fromisoformat(r_data["last_analyzed"])
                
            new_repo = Repository(**r_data, user_id=target_user_id)
            session.add(new_repo)

        await session.commit()
        print(f"✅ {len(data['repositories'])}개의 시드 데이터를 DB에 성공적으로 주입했습니다!")

if __name__ == "__main__":
    asyncio.run(load_data())
