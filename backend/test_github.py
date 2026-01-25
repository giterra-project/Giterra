import asyncio
import httpx
import os
import re
from dotenv import load_dotenv

# .env파일 backend폴더에 만들고, GITHUB_TOKEN = ""로 설정하기

# .env 파일 로드
load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

TARGET_USER = "jih19984" # 깃허브 아이디

HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

async def get_user_repos():
    if not GITHUB_TOKEN:
        print("❌ 에러: .env 파일에 GITHUB_TOKEN이 설정되지 않았습니다.")
        return

    async with httpx.AsyncClient() as client:
        # 유저의 레포지토리 목록 가져오기
        url = f"https://api.github.com/users/{TARGET_USER}/repos"
        response = await client.get(url, headers=HEADERS)
        
        if response.status_code != 200:
            print(f"❌ 에러: 데이터를 가져오지 못했습니다. (상태 코드: {response.status_code})")
            print(f"메시지: {response.json().get('message')}")
            return

        repos = response.json()
        
        print(f"✅ {TARGET_USER}님의 레포지토리 {len(repos)}개를 찾았습니다.\n")
        
        # 첫 번째 레포지토리만 샘플로 분석
        if repos:
            await analyze_repo_commits(client, repos[0]['name'])

async def analyze_repo_commits(client, repo_name):
    print(f"🔍 [{repo_name}] 분석 시작...")
    
    #  해당 레포지토리의 커밋 기록 가져오기 (최근 100개)
    url = f"https://api.github.com/repos/{TARGET_USER}/{repo_name}/commits?per_page=100"
    response = await client.get(url, headers=HEADERS)
    commits = response.json()
    
    if not isinstance(commits, list):
        print(f"   ⚠️ 커밋 정보를 가져오지 못했습니다. ({repo_name}이 비어있을 수 있습니다.)")
        return

    feat_count = 0
    fix_count = 0
    
    # 커밋 메시지 분석 로직
    for commit in commits:
        message = commit['commit']['message'].lower()
        
        if re.search(r'\bfeat\b', message):
            feat_count += 1
        elif re.search(r'\bfix\b', message):
            fix_count += 1
            
    print(f"   - 총 분석 커밋: {len(commits)}개")
    print(f"   - ✨ Feat(기능 구현): {feat_count}개")
    print(f"   - 🐛 Fix(버그 수정): {fix_count}개")
    
    # 타입 결정
    if feat_count > fix_count:
        print("   👉 결과: [미래 도시 숲] 타입 (기능 구현 중심)")
    elif fix_count > 0:
        print("   👉 결과: [연구소 돔] 타입 (안정성 위주)")
    else:
        print("   👉 결과: [평화로운 들판] 타입 (분석할 키워드가 부족함)")

if __name__ == "__main__":
    asyncio.run(get_user_repos())
