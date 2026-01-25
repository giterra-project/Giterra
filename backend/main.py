import os
import httpx
import asyncio
import logging
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from collections import Counter

# [변경점] 분리한 auth 모듈 임포트
from auth import router as auth_router

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# .env 로드
load_dotenv()

app = FastAPI(title="Giterra Backend")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# [변경점] 분리된 Auth 라우터 등록
app.include_router(auth_router)

# 설정
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

# 분석할 키워드 맵
KEYWORD_MAP = {
    "feat": ["feat", "add", "create", "implement", "추가", "구현", "생성"],
    "fix": ["fix", "bug", "patch", "issue", "수정", "해결", "고침", "오류"],
    "docs": ["docs", "readme", "document", "문서", "설명", "주석"],
    "refactor": ["refactor", "clean", "simplify", "개선", "리팩"],
    "test": ["test", "testing", "spec", "테스트"],
    "chore": ["chore", "build", "config", "setting", "설정", "배포"]
}

class AnalyzeRequest(BaseModel):
    github_username: str
    selected_repos: List[str]

class RepoInfo(BaseModel):
    name: str
    description: Optional[str]
    stars: int
    language: Optional[str]
    url: str

# 유틸리티 함수 

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

# API 엔드포인트

@app.get("/")
async def root():
    return {"message": "Giterra API Server is running!"}

@app.get("/repos/{username}", response_model=List[RepoInfo])
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
                    url=r['html_url']
                ) for r in response.json()
            ]
        except httpx.RequestError as e:
            logger.error(f"Network error: {e}")
            raise HTTPException(status_code=503, detail="GitHub API connection failed")

@app.post("/analyze")
async def analyze_selected_repos(request: AnalyzeRequest):
    user = request.github_username
    repos = request.selected_repos

    if not repos:
        raise HTTPException(status_code=400, detail="No repos selected")

    async with httpx.AsyncClient() as client:
        tasks = [fetch_repo_details(client, user, repo) for repo in repos]
        results = await asyncio.gather(*tasks)

        # 전체 커밋 통계 합산
        total_stats = Counter()
        for r in results:
            if "commit_stats" in r:
                total_stats.update(r["commit_stats"])
        
        # 전체 언어 통계 합산 (Bytes 기준)
        total_languages = Counter()
        for r in results:
            if "languages" in r:
                total_languages.update(r["languages"])
        
        top_languages = dict(total_languages.most_common(3))
        
        # 성향 결정
        persona = "평화로운 들판 (Normal)"
        if total_stats["feat"] > total_stats["fix"]:
            persona = "미래 도시 숲 (Builder)"
        elif total_stats["fix"] > total_stats["refactor"]:
            persona = "연구소 돔 (Fixer)"
        elif total_stats["docs"] > total_stats["feat"]:
            persona = "지식의 도서관 (Documenter)"
        # 아무 결과가 없을 때 
        elif sum(total_stats.values()) == 0 and not top_languages:
            persona = "새싹이 돋아나는 땅 (Beginner)"

        return {
            "status": "success",
            "summary": {
                "username": user,
                "persona": persona,
                "main_languages": list(top_languages.keys()),
                "total_commit_summary": dict(total_stats),
                "has_warnings": any(r.get("status") != "success" for r in results)
            },
            "language_distribution": dict(total_languages),
            "detailed_results": results
        }