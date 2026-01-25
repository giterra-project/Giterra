import os
import re
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# .env 로드
load_dotenv()

app = FastAPI(title="Giterra Backend")

# 설정
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

class AnalyzeRequest(BaseModel):
    github_username: str

@app.get("/")
async def root():
    return {"message": "Giterra API Server is running!"}

@app.post("/analyze")
async def analyze_developer(request: AnalyzeRequest):
    user = request.github_username
    
    if not GITHUB_TOKEN:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN is not configured")

    async with httpx.AsyncClient() as client:
        # 1. 유저의 레포지토리 목록 가져오기
        repo_url = f"https://api.github.com/users/{user}/repos"
        repo_res = await client.get(repo_url, headers=HEADERS)
        
        if repo_res.status_code != 200:
            raise HTTPException(status_code=repo_res.status_code, detail="Failed to fetch repos")
        
        repos = repo_res.json()
        if not repos:
            return {"username": user, "message": "No repositories found"}

        # 2. 첫 번째 레포지토리 우선 분석 (샘플)
        target_repo = repos[0]['name']
        commit_url = f"https://api.github.com/repos/{user}/{target_repo}/commits?per_page=50"
        commit_res = await client.get(commit_url, headers=HEADERS)
        
        feat_count = 0
        fix_count = 0
        total_commits = 0

        if commit_res.status_code == 200:
            commits = commit_res.json()
            total_commits = len(commits)
            for commit in commits:
                msg = commit['commit']['message'].lower()
                if re.search(r'\bfeat\b', msg):
                    feat_count += 1
                elif re.search(r'\bfix\b', msg):
                    fix_count += 1

        # 3. 타입 결정 로직
        persona = "평화로운 들판 (Normal)"
        if feat_count > fix_count:
            persona = "미래 도시 숲 (Builder)"
        elif fix_count > 0:
            persona = "연구소 돔 (Fixer)"

        return {
            "status": "success",
            "data": {
                "username": user,
                "analyzed_repo": target_repo,
                "total_commits": total_commits,
                "stats": {
                    "feat": feat_count,
                    "fix": fix_count
                },
                "persona": persona,
                "recommendation": f"{user}님은 {persona} 타입을 선호하시는군요!"
            }
        }
