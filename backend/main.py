import os
import httpx
import uvicorn

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# LangGraph & Gemini 관련 임포트
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict

load_dotenv()
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app = FastAPI()

class AnalyzeRequest(BaseModel):
    github_username: str

@app.post("/analyze")
async def analyze_developer(request: AnalyzeRequest):
    """
    1. 프론트엔드로부터 github_username을 받음
    2. (추후 구현) LangChain으로 GitHub 데이터 수집 및 성향 분석
    3. 분석 결과 반환
    """
    user = request.github_username
    
    # 지금은 로직이 없으니 더미 데이터를 반환해 봅니다.
    return {
        "status": "success",
        "username": user,
        "persona": "꼼꼼한 기록가형 (The Archivist)", # 나중에 Gemini가 분석해줄 내용
        "message": f"{user}님의 분석이 시작되었습니다."
    }
# --- 추가된 코드: GitHub 로그인 엔드포인트 ---
@app.get("/login/github")
async def github_login():
    if not GITHUB_CLIENT_ID:
        return {"error": "GitHub Client ID가 설정되지 않았습니다."}
        
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email"
    )

@app.get("/auth/callback")
async def github_callback(code: str):
    async with httpx.AsyncClient() as client:
        # 1. 코드를 이용해 액세스 토큰 요청
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        token_json = token_response.json()
        access_token = token_json.get("access_token")

        if not access_token:
            return {"error": "토큰 발급 실패", "details": token_json}

        # 토큰을 들고 프론트엔드 페이지로 이동(Redirect)함
        redirect_url = f"{FRONTEND_URL}/login/success?token={access_token}"
        
        return RedirectResponse(redirect_url)


if __name__ == "__main__":
    # uvicorn을 사용하여 FastAPI 서버 실행
    # reload=True는 코드 수정 시 자동 재시작 옵션입니다.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
