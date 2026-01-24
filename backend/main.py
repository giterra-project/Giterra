from fastapi import FastAPI
from pydantic import BaseModel

# LangGraph & Gemini 관련 임포트
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict

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

def main():
    print("Hello from backend!")


if __name__ == "__main__":
    main()
