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
            
            return [
                RepoInfo(
                    name=r['name'],
                    description=r['description'],
                    stars=r['stargazers_count'],
                    language=r['language'],
                    url=r['html_url'],
                    updated_at=r['updated_at']
                ) for r in response.json()
            ]
        except httpx.RequestError as e:
            logger.error(f"Network error: {e}")
            raise HTTPException(status_code=503, detail="GitHub API connection failed")

from sqlmodel import select
from app.models import User, Repository
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
                msg = commit['commit']['message'].lower()
                for category, keywords in KEYWORD_MAP.items():
                    if any(kw in msg for kw in keywords):
                        stats[category] += 1
        
        # 언어 분석
        if isinstance(lang_res, httpx.Response) and lang_res.status_code == 200:
            languages = lang_res.json()

        return {
            "repo": repo,
            "total_commits": total_commits,
            "commit_stats": stats,
            "languages": languages,
            "latest_commit_date": latest_commit_date,
            "status": "success" if total_commits > 0 or languages else "partial_success"
        }
    except Exception as e:
        logger.exception(f"Error analyzing {repo}")
        return {"repo": repo, "error": str(e), "status": "failed"}

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

    async with httpx.AsyncClient() as client:
        tasks = [analyze_repo_details(client, user_name, repo) for repo in repo_names]
        results = await asyncio.gather(*tasks)

        # 전체 통계 합산 및 개별 저장
        total_stats = Counter()
        total_languages = Counter()
        
        for r in results:
            if r.get("status") == "failed":
                continue
                
            if "commit_stats" in r:
                total_stats.update(r["commit_stats"])
            if "languages" in r:
                total_languages.update(r["languages"])
            
            # 개별 레포지토리 DB 저장/업데이트
            repo_name = r["repo"]
            repo_stmt = select(Repository).where(Repository.user_id == db_user.id, Repository.name == repo_name)
            repo_res = await db.execute(repo_stmt)
            db_repo = repo_res.scalars().first()
            
            # 레포별 성향 결정 (간단)
            repo_stats = r["commit_stats"]
            repo_type = "Normal"
            if repo_stats["feat"] > repo_stats["fix"]: repo_type = "Builder"
            elif repo_stats["fix"] > 0: repo_type = "Fixer"

            # 최신 커밋 날짜 추출
            latest_commit_date = None
            if "latest_commit_date" in r:
                latest_commit_date = r["latest_commit_date"]

            if db_repo:
                db_repo.analysis_type = repo_type
                db_repo.analysis_summary = f"Commits: {r['total_commits']}, Langs: {list(r['languages'].keys())}"
                db_repo.last_analyzed = datetime.now()
                if latest_commit_date:
                    db_repo.latest_commit = latest_commit_date
            else:
                db_repo = Repository(
                    user_id=db_user.id,
                    name=repo_name,
                    analysis_type=repo_type,
                    analysis_summary=f"Commits: {r['total_commits']}, Langs: {list(r['languages'].keys())}",
                    last_analyzed=datetime.now(),
                    latest_commit=latest_commit_date
                )
                db.add(db_repo)

        # 가공 로직: 휴리스틱 가중치 적용
        WEIGHTS = {
            "feat": 1.0,
            "refactor": 2.0,
            "test": 2.7,
            "fix": 4.0,
            "docs": 4.0,
            "chore": 1.0 
        }

        # 페르소나 명칭 매핑
        PERSONA_NAMES = {
            "feat": "미래 도시 숲 (Builder)",
            "refactor": "장인의 정원 (Refactorer)",
            "test": "심해의 관측 기지 (Tester)",
            "fix": "연구소 돔 (Fixer)",
            "docs": "지식의 도서관 (Documenter)"
        }

        # 항목별 점수 산출
        scores = {}
        for key in KEYWORD_MAP.keys():
            weight = WEIGHTS.get(key, 1.0)
            scores[key] = round(total_stats[key] * weight, 1)

        # 최종 페르소나 결정
        total_score = sum(scores.values())
        top_languages = dict(total_languages.most_common(3))

        if total_score < 5:  # 데이터 부족하면 기본
            persona = "새싹이 돋아나는 땅 (Beginner)"
        else:
            # 점수가 가장 높은 카테고리 추출 
            # 점수가 같을 시 우선순위대로 정렬 (우선순위: Fix > Docs > Test > Refactor > Feat)
            dominant_trait = max(scores, key=scores.get)
            persona = PERSONA_NAMES.get(dominant_trait, "평화로운 들판 (Normal)")

        await db.commit()

        return {
            "status": "success",
            "summary": {
                "username": user_name,
                "persona": persona,
                "main_languages": list(top_languages.keys()),
                "total_score": round(total_score, 1),
                "commit_stats": dict(total_stats),
                "weighted_scores": scores
            },
            "detailed_results": results
        }
