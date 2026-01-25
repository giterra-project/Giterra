import os
import re
import httpx
import asyncio
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from collections import Counter

# .env 로드
load_dotenv()

app = FastAPI(title="Giterra Backend")

# 설정
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

# --- 데이터 모델 ---

class AnalyzeRequest(BaseModel):
    github_username: str
    selected_repos: List[str]

class RepoInfo(BaseModel):
    name: str
    description: Optional[str]
    stars: int
    language: Optional[str]
    url: str

# --- 유틸리티 함수 ---

async def fetch_repo_details(client: httpx.AsyncClient, user: str, repo: str):
    """커밋 로그와 사용 언어를 함께 수집합니다."""
    commit_url = f"https://api.github.com/repos/{user}/{repo}/commits?per_page=50"
    lang_url = f"https://api.github.com/repos/{user}/{repo}/languages"
    
    try:
        # 커밋과 언어 정보를 병렬로 가져오기
        commit_res, lang_res = await asyncio.gather(
            client.get(commit_url, headers=HEADERS),
            client.get(lang_url, headers=HEADERS)
        )
        
        # 1. 커밋 분석
        stats = {"feat": 0, "fix": 0, "docs": 0, "refactor": 0, "test": 0, "chore": 0}
        total_commits = 0
        if commit_res.status_code == 200:
            commits = commit_res.json()
            total_commits = len(commits)
            for commit in commits:
                msg = commit['commit']['message'].lower()
                for key in stats.keys():
                    if re.search(r'\b' + key + r'\b', msg):
                        stats[key] += 1
        
        # 2. 언어 분석 (byte 단위)
        languages = lang_res.json() if lang_res.status_code == 200 else {}
        
        return {
            "repo": repo,
            "total_commits": total_commits,
            "commit_stats": stats,
            "languages": languages
        }
    except Exception as e:
        return {"repo": repo, "error": str(e)}

# --- API 엔드포인트 ---

@app.get("/")
async def root():
    return {"message": "Giterra API Server is running!"}

@app.get("/repos/{username}", response_model=List[RepoInfo])
async def get_user_repositories(username: str):
    if not GITHUB_TOKEN:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN not configured")
    
    async with httpx.AsyncClient() as client:
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=100"
        response = await client.get(url, headers=HEADERS)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="User not found")
        
        return [
            RepoInfo(
                name=r['name'],
                description=r['description'],
                stars=r['stargazers_count'],
                language=r['language'],
                url=r['html_url']
            ) for r in response.json()
        ]

@app.post("/analyze")
async def analyze_selected_repos(request: AnalyzeRequest):
    user = request.github_username
    repos = request.selected_repos

    if not repos:
        raise HTTPException(status_code=400, detail="No repos selected")

    async with httpx.AsyncClient() as client:
        tasks = [fetch_repo_details(client, user, repo) for repo in repos]
        results = await asyncio.gather(*tasks)

        # 1. 전체 커밋 통계 합산
        total_stats = Counter()
        for r in results:
            if "commit_stats" in r:
                total_stats.update(r["commit_stats"])
        
        # 2. 전체 언어 통계 합산 (Bytes 기준)
        total_languages = Counter()
        for r in results:
            if "languages" in r:
                total_languages.update(r["languages"])
        
        # 상위 3개 언어 추출
        top_languages = dict(total_languages.most_common(3))
        
        # 3. 성향 결정 (복합 로직)
        persona = "평화로운 들판 (Normal)"
        if total_stats["feat"] > total_stats["fix"]:
            persona = "미래 도시 숲 (Builder)"
        elif total_stats["fix"] > total_stats["refactor"]:
            persona = "연구소 돔 (Fixer)"
        elif total_stats["docs"] > total_stats["feat"]:
            persona = "지식의 도서관 (Documenter)"

        return {
            "status": "success",
            "summary": {
                "username": user,
                "persona": persona,
                "main_languages": list(top_languages.keys()),
                "total_commit_summary": dict(total_stats)
            },
            "language_distribution": dict(total_languages),
            "detailed_results": results
        }
