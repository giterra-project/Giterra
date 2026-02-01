import httpx
import httpx
import asyncio
import logging
from datetime import datetime
from app.schemas import AnalyzeRequest
from app.schemas import RepoInfo
from fastapi import HTTPException
from collections import Counter
from app.core.config import settings

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


GITHUB_TOKEN = settings.GITHUB_TOKEN
HEADERS = settings.GITHUB_HEADERS

# 분석할 키워드 맵
KEYWORD_MAP = {
    "feat": ["feat", "add", "create", "implement", "추가", "구현", "생성"],
    "fix": ["fix", "bug", "patch", "issue", "수정", "해결", "고침", "오류"],
    "docs": ["docs", "readme", "document", "문서", "설명", "주석"],
    "refactor": ["refactor", "clean", "simplify", "개선", "리팩"],
    "test": ["test", "testing", "spec", "테스트"],
    "chore": ["chore", "build", "config", "setting", "설정", "배포"]
}

async def fetch_repo_details(client: httpx.AsyncClient, user: str, repo: str):
    """커밋 로그와 사용 언어를 함께 수집합니다 (유연한 키워드 분석)."""
    commit_url = f"https://api.github.com/repos/{user}/{repo}/commits?per_page=50"
    lang_url = f"https://api.github.com/repos/{user}/{repo}/languages"
    
    try:
        commit_res, lang_res = await asyncio.gather(
            client.get(commit_url, headers=HEADERS),
            client.get(lang_url, headers=HEADERS),
            return_exceptions=True
        )

        stats = {key: 0 for key in KEYWORD_MAP.keys()}
        total_commits = 0
        languages = {}

        # 커밋 분석
        if isinstance(commit_res, httpx.Response) and commit_res.status_code == 200:
            commits = commit_res.json()
            total_commits = len(commits)
            for commit in commits:
                msg = commit['commit']['message'].lower()
                
                # 카테고리당 최대 1점만 부여 
                # 예: "feat: 기능 추가 및 성능 개선" -> feat 1점, refactor 1점
                for category, keywords in KEYWORD_MAP.items():
                    if any(kw in msg for kw in keywords):
                        stats[category] += 1
        elif isinstance(commit_res, httpx.Response):
            if commit_res.status_code == 409:
                logger.warning(f"Repo {repo} is empty (409 Conflict)")
            elif commit_res.status_code == 403:
                logger.error("GitHub API Rate limit exceeded (403 Forbidden)")
            else:
                logger.error(f"Failed to fetch commits for {repo}: {commit_res.status_code}")
        
        # 언어 분석
        if isinstance(lang_res, httpx.Response) and lang_res.status_code == 200:
            languages = lang_res.json()
        elif isinstance(lang_res, httpx.Response):
            logger.warning(f"Failed to fetch languages for {repo}: {lang_res.status_code}")

        return {
            "repo": repo,
            "total_commits": total_commits,
            "commit_stats": stats,
            "languages": languages,
            "status": "success" if total_commits > 0 or languages else "partial_success"
        }

    except Exception as e:
        logger.exception(f"Unexpected error analyzing {repo}")
        return {"repo": repo, "error": str(e), "status": "failed"}

async def get_user_repositories(username: str):
    if not GITHUB_TOKEN:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN not configured")
    
    async with httpx.AsyncClient() as client:
        try:
            url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=100"
            response = await client.get(url, headers=HEADERS)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found")
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="GitHub API Error")
            
            repos = [
                RepoInfo(
                    name=r['name'],
                    description=r['description'],
                    stars=r['stargazers_count'],
                    language=r['language'],
                    url=r['html_url'],
                    updated_at=r['updated_at']
                ) for r in response.json()
            ]

            # Giter라 표준 정렬 로직 적용: Star 많은 순 -> 최신 업데이트 순
            repos.sort(key=lambda x: (x.stars, x.updated_at), reverse=True)
            
            return repos
        except httpx.RequestError as e:
            logger.error(f"Network error: {e}")
            raise HTTPException(status_code=503, detail="GitHub API connection failed")

from sqlmodel import select
from app.models import User, Repository, UserProfile
from sqlalchemy.ext.asyncio import AsyncSession

async def analyze_repo_details(client: httpx.AsyncClient, user: str, repo: str):
    """개별 레포지토리의 상세 정보를 수집하고 가공합니다."""
    commit_url = f"https://api.github.com/repos/{user}/{repo}/commits?per_page=50"
    lang_url = f"https://api.github.com/repos/{user}/{repo}/languages"
    
    try:
        commit_res, lang_res = await asyncio.gather(
            client.get(commit_url, headers=HEADERS),
            client.get(lang_url, headers=HEADERS),
            return_exceptions=True
        )

        stats = {key: 0 for key in KEYWORD_MAP.keys()}
        total_commits = 0
        languages = {}
        commit_messages = [] # 커밋 메시지 저장

        # 커밋 분석
        latest_commit_date = None
        if isinstance(commit_res, httpx.Response) and commit_res.status_code == 200:
            commits = commit_res.json()
            total_commits = len(commits)
            if total_commits > 0:
                # 첫 번째 커밋(최신)의 날짜 추출
                date_str = commits[0]['commit']['committer']['date']
                latest_commit_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")

            for commit in commits:
                msg = commit['commit']['message']
                commit_messages.append(msg) # 메시지 원본 저장
                
                lower_msg = msg.lower()
                for category, keywords in KEYWORD_MAP.items():
                    if any(kw in lower_msg for kw in keywords):
                        stats[category] += 1
        
        # 언어 분석
        if isinstance(lang_res, httpx.Response) and lang_res.status_code == 200:
            languages = lang_res.json()

        return {
            "repo": repo,
            "total_commits": total_commits,
            "commit_stats": stats,
            "languages": languages,
            "commit_messages": commit_messages, # 반환값 추가
            "latest_commit_date": latest_commit_date,
            "status": "success" if total_commits > 0 or languages else "partial_success"
        }
    except Exception as e:
        logger.exception(f"Error analyzing {repo}")
        return {"repo": repo, "error": str(e), "status": "failed"}

from app.services.graph import langgraph_app

async def analyze_selected_repos(request: AnalyzeRequest, db: AsyncSession):
    user_name = request.github_username
    repo_names = request.selected_repos

    if not repo_names:
        raise HTTPException(status_code=400, detail="No repos selected")

    # 1. DB에서 유저 확인
    statement = select(User).where(User.username == user_name)
    result = await db.execute(statement)
    db_user = result.scalars().first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found in DB. Please login first.")

    if db_user.id is None:
        raise HTTPException(status_code=500, detail="User ID is missing")

    # 2. GitHub에서 데이터 수집 (커밋 메시지 등)
    async with httpx.AsyncClient() as client:
        tasks = [analyze_repo_details(client, user_name, repo) for repo in repo_names]
        results = await asyncio.gather(*tasks)

    # 3. LangGraph 입력 데이터 구성
    repo_inputs = []
    failed_repos = []
        
    for r in results:
        if r.get("status") == "failed":
            failed_repos.append(r["repo"])
            continue
            
        repo_inputs.append({
            "repo_name": r["repo"],
            "commits": r.get("commit_messages", [])
        })

    if not repo_inputs:
        raise HTTPException(status_code=500, detail="Failed to fetch data for all repositories")

    # 4. AI 분석 실행 (LangGraph)
    try:
        # LangGraph invoke
        graph_input = {
            "github_username": user_name,
            "repos_input": repo_inputs
        }
        
        # 비동기 실행
        ai_result = await langgraph_app.ainvoke(graph_input)
        
        repo_analyses = ai_result["repo_analyses"] # List[RepoAnalysisResult]
        final_persona = ai_result["final_persona"]

        # 5. DB 저장
        total_stats = Counter() # 통계용 (기존 로직 유지)
        total_languages = Counter()
        main_type_by_repo = {}
        db_repo_by_name = {}

        for analysis in repo_analyses:
            # 원본 fetch 결과 찾기 (통계 데이터 합산을 위해)
            original_data = next((item for item in results if item["repo"] == analysis.repo_name), None)
            
            repo_stmt = select(Repository).where(Repository.user_id == db_user.id, Repository.name == analysis.repo_name)
            repo_res = await db.execute(repo_stmt)
            db_repo = repo_res.scalars().first()
            
            # DB 필드 매핑
            # tech_view -> analysis_sub1
            # stability_view -> analysis_sub2
            # comm_view -> analysis_sub3
            # summary -> analysis_summary (요약 덮어쓰기)
            
            # Repository Type 결정 로직은 기존 유지하거나 AI가 정해준대로 할 수도 있음.
            # 여기서는 Keyword 기반으로 타입을 정하고, 내용은 AI 분석으로 채움.
            
            latest_commit_date = None
            repo_stats = {}

            if original_data:
                repo_stats = original_data.get("commit_stats") or {}
                total_stats.update(repo_stats)
                total_languages.update(original_data.get("languages") or {})
                latest_commit_date = original_data.get("latest_commit_date")

            if not repo_stats:
                main_type = "chore"
            else:
                main_type = max(repo_stats, key=repo_stats.get)

            main_type_by_repo[analysis.repo_name] = main_type

            if db_repo:
                db_repo.analysis_summary = analysis.summary
                db_repo.analysis_sub1 = analysis.tech_view
                db_repo.analysis_sub2 = analysis.stability_view
                db_repo.analysis_sub3 = analysis.comm_view
                db_repo.last_analyzed = datetime.now()
                if latest_commit_date:
                    db_repo.latest_commit = latest_commit_date
            else:
                db_repo = Repository(
                    user_id=db_user.id,
                    name=analysis.repo_name,
                    analysis_summary=analysis.summary,
                    analysis_sub1=analysis.tech_view,
                    analysis_sub2=analysis.stability_view,
                    analysis_sub3=analysis.comm_view,
                    last_analyzed=datetime.now(),
                    latest_commit=latest_commit_date
                )
                db.add(db_repo)

            db_repo_by_name[analysis.repo_name] = db_repo

        # 가공 로직: 휴리스틱 가중치 적용
        WEIGHTS = {
            "feat": 1.0,
            "refactor": 3.0,
            "test": 4.0,
            "fix": 4.0,
            "docs": 4.0,
            "chore": 1.0 
        }

        # 1. 테마(Persona) 정의 - 이미지 기준 4가지
        PERSONA_MAP = {
            "future_city": "미래 도시 숲 (Future City)",      # Balanced (Feat 위주 or 골고루)
            "lab_dome": "연구소 돔 (Lab Dome)",             # Stability (Fix/Test 위주)
            "primitive_forest": "원시의 숲 (Primitive Forest)", # Pioneer (Refactor/Docs? Feat?)
            "start_tree": "시작의 나무 (Start Tree)"          # Early (Low commits)
        }
        
        # 2. 오브젝트 매핑 테이블 (Theme -> CommitType -> ObjectName)
        OBJECT_MAPPING = {
            "future_city": {
                "feat": "GlassBuilding",    # 유리 빌딩
                "fix": "HologramTree",      # 홀로그램 나무
                "refactor": "Hyperloop",    # 하이퍼루프 도로
                "docs": "HologramSign",     # 홀로그램 간판
                "chore": "Drone",           # 가로등/드론
            },
            "lab_dome": {
                "feat": "MetalBunker",      # 메탈 벙커
                "fix": "ShieldTurret",      # 방어 포탑/실드
                "refactor": "PipeLine",     # 연결 파이프
                "docs": "SatelliteDish",    # 위성 안테나
                "chore": "Ventilation",     # 환풍구/조명
            },
            "primitive_forest": {
                "feat": "GiantTree",        # 거대 고목
                "fix": "MossRock",          # 이끼 낀 바위
                "refactor": "VineBridge",   # 덩굴 줄기
                "docs": "AncientRune",      # 고대 비석(룬)
                "chore": "WildFlower",      # 덤불/야생화
            },
            "start_tree": {
                "feat": "Sprout",           # 새싹/묘목
                "fix": "Pebble",            # 작은 조약돌
                "refactor": "SteppingStone",# 징검다리
                "docs": "Firefly",          # 반딧불이
                "chore": "Leaf",            # 떨어진 잎사귀
            }
        }

        # 항목별 점수 산출
        scores = {}
        for key in KEYWORD_MAP.keys():
            weight = WEIGHTS.get(key, 1.0)
            scores[key] = round(total_stats[key] * weight, 1)

        # 최종 테마(Persona) 결정 로직
        total_score = sum(scores.values())
        top_languages = dict(total_languages.most_common(3))
        
        theme_key = "future_city" # default

        if total_score < 5:  
            theme_key = "start_tree"
        else:
            # 점수가 가장 높은 카테고리 추출
            dominant_trait = max(scores, key=scores.get)
            
            # Trait -> Theme 매핑 규칙 (간소화)
            if dominant_trait in ["fix", "test"]:
                theme_key = "lab_dome"
            elif dominant_trait in ["refactor", "docs"]:
                theme_key = "primitive_forest"
            else:
                theme_key = "future_city" # feat, chore 등

        persona = PERSONA_MAP[theme_key]

        profile_stmt = select(UserProfile).where(UserProfile.user_id == db_user.id)
        profile_res = await db.execute(profile_stmt)
        profile = profile_res.scalars().first()
        now = datetime.now()

        if profile:
            profile.persona = persona
            profile.theme = theme_key
            profile.total_score = float(total_score)
            profile.overall_analysis = final_persona
            profile.last_analyzed = now
        else:
            db.add(
                UserProfile(
                    user_id=db_user.id,
                    persona=persona,
                    theme=theme_key,
                    total_score=float(total_score),
                    overall_analysis=final_persona,
                    last_analyzed=now,
                )
            )

        for repo_name, db_repo in db_repo_by_name.items():

            main_type = main_type_by_repo.get(repo_name, "chore")
            obj_name = OBJECT_MAPPING.get(theme_key, {}).get(main_type, "Unknown")
            if obj_name == "Unknown":
                obj_name = OBJECT_MAPPING.get(theme_key, {}).get("chore", "Unknown")

            db_repo.analysis_type = obj_name

        await db.commit()

        # 상세 결과에 building_type 주입
        final_details = []
        for r in results:
            repo_copy = r.copy()
            c_stats = r.get("commit_stats") or {}

            if not c_stats:
                main_type = "chore"
            else:
                main_type = max(c_stats, key=c_stats.get)

            obj_name = OBJECT_MAPPING.get(theme_key, {}).get(main_type, "Unknown")
            if obj_name == "Unknown":
                obj_name = OBJECT_MAPPING.get(theme_key, {}).get("chore", "Unknown")

            repo_copy["building_type"] = obj_name
            repo_copy["theme_key"] = theme_key
            final_details.append(repo_copy)

        return {
            "summary": {
                "username": user_name,
                "persona": persona, # 한글 명칭
                "theme": theme_key, # 키값 (프론트에서 스타일링용)
                "main_languages": list(top_languages.keys()),
                "total_score": round(total_score, 1),
                "commit_stats": dict(total_stats),
                "weighted_scores": scores
            },
            "detailed_results": final_details
        }
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("Error analyzing selected repositories")
        raise HTTPException(status_code=500, detail="Failed to analyze repositories") from e
