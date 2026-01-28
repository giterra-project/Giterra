import asyncio
import sys
import os
from sqlalchemy import text

# Windows 호환성 설정
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session

async def view_collected_data():
    async with async_session() as session:
        print("\n=== 👥 수집된 네임드 유저 요약 ===")
        user_query = text("SELECT username, id FROM users WHERE github_id LIKE 'named_%' OR username IN ('tiangolo', 'yyx990803', 'antfu', 'sindresorhus', 'karpathy', 'tj', 'gaearon', 'defunkt', 'mojombo', 'kennethreitz')")
        users = await session.execute(user_query)
        
        for user in users:
            print(f"\n👤 유저: {user.username} (ID: {user.id})")
            
            # 해당 유저의 분석된 레포지토리 가져오기
            repo_query = text("SELECT name, analysis_type, latest_commit FROM repositories WHERE user_id = :user_id")
            repos = await session.execute(repo_query, {"user_id": user.id})
            
            repo_list = repos.all()
            if not repo_list:
                print("   - 분석된 레포지토리 없음")
                continue
                
            for repo in repo_list:
                print(f"   🪐 [{repo.analysis_type:10}] {repo.name} (최신커밋: {repo.latest_commit})")

async def main():
    await view_collected_data()
    print("\n" + "="*50)

if __name__ == "__main__":
    asyncio.run(main())
