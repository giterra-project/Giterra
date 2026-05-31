import asyncio
import logging
from datetime import datetime
import httpx
from app.schemas import AnalyzeRequest, AnalyzedPlanetType, AnalyzePlanetTypesResult, PlanetType
from app.schemas import RepoInfo
from fastapi import HTTPException
from collections import Counter
from app.core.config import settings
from sqlmodel import select
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Repository

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# 전역 토큰 지양 (사용자별 토큰 사용 권장)

# 분석할 키워드 맵
KEYWORD_MAP = {
    "feat": ["feat", "add", "create", "implement", "추가", "구현", "생성"],
    "fix": ["fix", "bug", "patch", "issue", "수정", "해결", "고침", "오류"],
    "docs": ["docs", "readme", "document", "문서", "설명", "주석"],
    "refactor": ["refactor", "clean", "simplify", "개선", "리팩"],
    "test": ["test", "testing", "spec", "테스트"],
    "chore": ["chore", "build", "config", "setting", "설정", "배포"]
}

COMMIT_CATEGORY_PLANET_TYPES = {
    "feat": PlanetType.EARTH,
    "fix": PlanetType.MARS,
    "docs": PlanetType.VENUS,
    "refactor": PlanetType.MERCURY,
    "test": PlanetType.SATURN,
    "chore": PlanetType.URANUS,
}

COMMIT_CATEGORY_REASONS = {
    "feat": "feat/구현 커밋 비중이 높아 기능 확장과 생명력이 강한 레포지토리로 판단했습니다.",
    "fix": "fix/수정 커밋 비중이 높아 문제 해결과 안정화 성향이 강한 레포지토리로 판단했습니다.",
    "docs": "docs/문서화 커밋 비중이 높아 설명과 정리 성향이 강한 레포지토리로 판단했습니다.",
    "refactor": "refactor/개선 커밋 비중이 높아 빠른 최적화와 구조 개선 성향이 강한 레포지토리로 판단했습니다.",
    "test": "test/검증 커밋 비중이 높아 안정성과 방어막 성향이 강한 레포지토리로 판단했습니다.",
    "chore": "chore/설정 커밋 비중이 높아 인프라와 시스템 관리 성향이 강한 레포지토리로 판단했습니다.",
}


def infer_planet_type(commit_stats: dict[str, int]) -> PlanetType:
    """커밋 성향에서 레포 행성 외형 타입을 결정한다.

    SUN은 중앙 항성 전용이므로 레포지토리 분석 결과에는 배정하지 않는다.
    """

    if not commit_stats:
        return PlanetType.NEPTUNE

    sorted_stats = sorted(commit_stats.items(), key=lambda item: item[1], reverse=True)
    dominant_category, dominant_count = sorted_stats[0]
    if dominant_count <= 0:
        return PlanetType.NEPTUNE

    if len(sorted_stats) > 1 and sorted_stats[1][1] == dominant_count:
        return PlanetType.JUPITER

    return COMMIT_CATEGORY_PLANET_TYPES.get(dominant_category, PlanetType.JUPITER)


def get_planet_type_reason(commit_stats: dict[str, int], planet_type: PlanetType) -> str:
    if planet_type == PlanetType.NEPTUNE:
        return "분석 가능한 커밋 데이터가 부족해 잠재력과 미지의 성격을 가진 레포지토리로 판단했습니다."

    if planet_type == PlanetType.JUPITER:
        return "여러 커밋 성향이 균형 있게 나타나 규모와 종합성이 강한 레포지토리로 판단했습니다."

    dominant_category = max(commit_stats, key=lambda key: commit_stats.get(key, 0))
    return COMMIT_CATEGORY_REASONS.get(
        dominant_category,
        "커밋 패턴을 종합해 가장 가까운 행성 타입으로 분류했습니다.",
    )


def get_github_headers(user: User) -> dict[str, str]:
    if user.access_token:
        return {
            "Authorization": f"token {user.access_token}",
            "Accept": "application/vnd.github.v3+json",
        }

    return settings.GITHUB_HEADERS


async def analyze_selected_repo_planet_types(
    db: AsyncSession,
    current_user: User,
    repo_ids: list[int],
) -> AnalyzePlanetTypesResult:
    unique_repo_ids = list(dict.fromkeys(repo_ids))
    if not unique_repo_ids:
        raise HTTPException(status_code=400, detail="분석할 레포지토리를 선택해 주세요.")

    statement = select(Repository).where(
        Repository.user_id == current_user.id,
        or_(
            Repository.id.in_(unique_repo_ids),  # type: ignore[union-attr]
            Repository.github_repo_id.in_(unique_repo_ids),
        ),
    )
    result = await db.execute(statement)
    repositories = result.scalars().all()

    repo_by_request_id: dict[int, Repository] = {}
    for repo in repositories:
        if repo.id in unique_repo_ids:
            repo_by_request_id[repo.id] = repo  # type: ignore[index]
        if repo.github_repo_id in unique_repo_ids:
            repo_by_request_id[repo.github_repo_id] = repo

    missing_repo_ids = [repo_id for repo_id in unique_repo_ids if repo_id not in repo_by_request_id]
    if missing_repo_ids:
        raise HTTPException(
            status_code=404,
            detail=f"소유한 레포지토리를 찾을 수 없습니다: {missing_repo_ids}",
        )

    headers = get_github_headers(current_user)
    ordered_repositories = [repo_by_request_id[repo_id] for repo_id in unique_repo_ids]

    async with httpx.AsyncClient() as client:
        tasks = [
            analyze_repo_details(client, current_user.username, repo.repo_name, headers)
            for repo in ordered_repositories
        ]
        analysis_results = await asyncio.gather(*tasks)

    planets: list[AnalyzedPlanetType] = []
    for repo, analysis in zip(ordered_repositories, analysis_results):
        commit_stats = analysis.get("commit_stats", {key: 0 for key in KEYWORD_MAP.keys()})
        total_commits = analysis.get("total_commits", 0)
        languages = analysis.get("languages", {})
        planet_type = infer_planet_type(commit_stats)
        reason = get_planet_type_reason(commit_stats, planet_type)

        repo.planet_type = planet_type.value
        repo.analysis_summary = reason
        repo.last_analyzed = datetime.now()
        if analysis.get("latest_commit_date"):
            repo.latest_commit = analysis["latest_commit_date"]

        planets.append(
            AnalyzedPlanetType(
                repoId=repo.id,  # type: ignore[arg-type]
                githubRepoId=repo.github_repo_id,
                repoName=repo.repo_name,
                repoURL=repo.html_url,
                planetType=planet_type,
                reason=reason,
                totalCommits=total_commits,
                commitStats=commit_stats,
                mainLanguages=list(languages.keys())[:3],
            )
        )

    await db.commit()
    return AnalyzePlanetTypesResult(planets=planets)

async def fetch_repo_details(client: httpx.AsyncClient, user: str, repo: str, headers: dict):
    """커밋 로그와 사용 언어를 함께 수집합니다."""
    commit_url = f"https://api.github.com/repos/{user}/{repo}/commits?per_page=50"
    lang_url = f"https://api.github.com/repos/{user}/{repo}/languages"
    
    try:
        commit_res, lang_res = await asyncio.gather(
            client.get(commit_url, headers=headers),
            client.get(lang_url, headers=headers),
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

async def get_user_repositories(username: str, db: AsyncSession):
    # 1. DB에서 사용자 토큰 조회
    statement = select(User).where(User.username == username)
    result = await db.execute(statement)
    db_user = result.scalars().first()
    
    if not db_user or not db_user.access_token:
        # DB에 토큰이 없으면 서버 공용 토큰으로 시도 (Public 레포 한정)
        logger.warning(f"No access token for {username}, falling back to server token")
        headers = settings.GITHUB_HEADERS
    else:
        headers = {
            "Authorization": f"token {db_user.access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

    async with httpx.AsyncClient() as client:
        try:
            url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=100"
            response = await client.get(url, headers=headers)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found")
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="GitHub API Error")
            
            repos = [
                RepoInfo(
                    repo_id=r['id'], 
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



async def analyze_repo_details(client: httpx.AsyncClient, user: str, repo: str, headers: dict):
    """개별 레포지토리의 상세 정보를 수집하고 가공합니다."""
    commit_url = f"https://api.github.com/repos/{user}/{repo}/commits?per_page=50"
    lang_url = f"https://api.github.com/repos/{user}/{repo}/languages"
    
    try:
        commit_res, lang_res = await asyncio.gather(
            client.get(commit_url, headers=headers),
            client.get(lang_url, headers=headers),
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

async def analyze_selected_repos(db: AsyncSession, current_user: User):
    user_name = current_user.username
    repo_names = ["example"] # TODO: DB에서 등록해둔 8개의 레포지토리 가져오기

    if not repo_names:
        raise HTTPException(status_code=400, detail="No repos selected")

    # 1. DB에서 유저 확인
    statement = select(User).where(User.username == user_name)
    result = await db.execute(statement)
    db_user = result.scalars().first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found in DB. Please login first.")

    # 2. 사용자 토큰으로 헤더 구성
    user_headers = {
        "Authorization": f"token {db_user.access_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    async with httpx.AsyncClient() as client:
        tasks = [analyze_repo_details(client, user_name, repo, user_headers) for repo in repo_names]
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
            repo_stmt = select(Repository).where(Repository.user_id == db_user.id, Repository.repo_name == repo_name)
            repo_res = await db.execute(repo_stmt)
            db_repo = repo_res.scalars().first()
            
            # 레포별 행성 외형 결정
            repo_stats = r["commit_stats"]
            planet_type = infer_planet_type(repo_stats).value

            # 최신 커밋 날짜 추출
            latest_commit_date = None
            if "latest_commit_date" in r:
                latest_commit_date = r["latest_commit_date"]

            if db_repo:
                db_repo.planet_type = planet_type
                db_repo.analysis_summary = f"Commits: {r['total_commits']}, Langs: {list(r['languages'].keys())}"
                db_repo.last_analyzed = datetime.now()
                if latest_commit_date:
                    db_repo.latest_commit = latest_commit_date
            else:
                db_repo = Repository(
                    user_id=db_user.id,
                    github_repo_id=0,
                    repo_name=repo_name,
                    html_url=f"https://github.com/{user_name}/{repo_name}",
                    planet_type=planet_type,
                    analysis_summary=f"Commits: {r['total_commits']}, Langs: {list(r['languages'].keys())}",
                    last_analyzed=datetime.now(),
                    latest_commit=latest_commit_date
                )
                db.add(db_repo)

        # 가공 로직: 휴리스틱 가중치 적용
        WEIGHTS = {
            "feat": 1.0,
            "refactor": 3.0,
            "test": 4.0,
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

# TODO: 새로 분석이니 이미 저장된 레포지토리들로 바로 분석 시작, 분석 로직은 위랑 같다
async def refresh_analyze_repos(db: AsyncSession, current_user: User):
    return None
