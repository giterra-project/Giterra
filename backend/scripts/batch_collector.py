import asyncio
import sys
import os

# Windows 호환성 설정
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# 프로젝트 루트를 path에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session
from app.models import User
from app.services.github import get_user_repositories, analyze_selected_repos
from app.schemas import AnalyzeRequest
from sqlmodel import select

# 수집 대상 글로벌 & 국내 네임드 개발자 (페르소나별 분류)
NAMED_USERS = [
    # 🌲 미래 도시 숲 (Builder): 새로운 기능 창조와 확장에 강점
    "antfu",          # Vite/Vue Core
    "sindresorhus",   # Global OSS King
    "karpathy",       # AI/Deep Learning (LLM implementations)
    "velopert",       # React Education/Full-stack
    "jojoldu",        # Java/Backend Tech Blog

    # 🔬 연구소 돔 (Fixer): 시스템 안정성 및 이슈 해결 중심
    "tiangolo",       # FastAPI (Docker/Environment management focus)
    "yyx990803",      # Vue.js Creator (Framework maintenance)
    "godorm",         # Cloud IDE Platform maintenance

    # 📚 지식의 도서관 (Documenter): 기록과 가이드 제작에 특화
    "jwasham",        # coding-interview-university
    "donnemartin",    # system-design-primer
    "kamranahmedse",  # developer-roadmap

    # 🪴 장인의 정원 (Refactorer): 코드 품질 개선 및 설계 최적화
    "woowacourse",     # 클린 코드 및 리팩토링 미션 중심 (확실한 Refactorer 표본)

    # 🔭 심해의 관측 기지 (Tester): 테스트 코드와 안정성 수호 (신규 후보)
    "aelassas",       # TDD Guide & Implementation focus
    "dwyl",           # Learn TDD & Testing methodologies
    "jeonghwan-kim",  # Frontend Testing (TDD 강의 등 활동)
    
    # 🌱 새싹이 돋아나는 땅 (Beginner): 탐험을 시작한 유저 예시
    "leebyeongmin"    # 데이터 부족 시 Fallback 테스트용
]

async def collect_user_data(username: str):
    async with async_session() as db:
        print(f"\n🚀 [{username}] 분석 프로세스 가동 (상위 8개 레포 분석)")
        
        try:
            # 1. DB 유저 등록 체크
            statement = select(User).where(User.username == username)
            result = await db.execute(statement)
            db_user = result.scalars().first()
            
            if not db_user:
                db_user = User(
                    github_id=f"named_{username}",
                    username=username,
                    avatar_url=f"https://github.com/{username}.png",
                    html_url=f"https://github.com/{username}"
                )
                db.add(db_user)
                await db.commit()
                await db.refresh(db_user)
            
            # 2. 유저 레포지토리 목록 가져오기
            repos = await get_user_repositories(username)
            
            # 정렬 로직: 1순위 Stars DESC, 2순위 UpdatedAt DESC (커밋 수 대용)
            # GitHub API 목록에서 커밋 수를 바로 주지 않으므로 최신 업데이트를 우선함
            sorted_repos = sorted(
                repos, 
                key=lambda x: (x.stars, x.updated_at), 
                reverse=True
            )[:8]  # 상위 8개 선정
            
            repo_names = [r.name for r in sorted_repos]
            print(f"   - 📂 선정된 8개 레포: {repo_names}")
            
            # 3. 정교한 분석 실행
            request = AnalyzeRequest(github_username=username, selected_repos=repo_names)
            analysis_result = await analyze_selected_repos(request, db)
            
            summary = analysis_result["summary"]
            print(f"   - ✨ 분석 완료! 페르소나: {summary['persona']} (점수: {summary['total_score']})")
            
        except Exception as e:
            print(f"   - ❌ 에러 발생 ({username}): {e}")

async def main():
    print("="*60)
    print("      Giterra Batch Data Collector v1.1 (Target: 8 Repos)")
    print("="*60)
    
    # 순차적으로 처리 (API Rate Limit 고려)
    for user in NAMED_USERS:
        await collect_user_data(user)
    
    print("\n" + "="*60)
    print("🎉 대량 데이터 수집이 성공적으로 마무리되었습니다.")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
