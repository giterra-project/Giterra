from fastapi import FastAPI
from pydantic import BaseModel

# LangGraph & Gemini 관련 임포트
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict

from typing import List, TypedDict, Annotated
import operator

app = FastAPI()

class AnalyzeRequest(BaseModel):
    github_username: str

# 1. 개별 레포지토리 분석 결과 상태
class RepoAnalysisState(TypedDict):
    repo_name: str
    commits: List[str] # 커밋 메시지들
    # 각 관점의 분석 결과
    tech_score: str
    stability_score: str
    comm_score: str
    # 레포 요약 결과
    repo_summary: str

# 2. 전체 그래프 상태 (Overall State)
class GiterraState(TypedDict):
    github_username: str
    repos_data: List[dict] # Raw Data
    
    # 각 레포별 분석 결과들을 모으는 리스트 (Reducer 사용)
    repo_summaries: Annotated[List[str], operator.add] 
    
    final_persona: str      # 최종 개발자 성향 (타이틀)
    final_description: str  # 최종 설명
    visualization_data: dict # 시각화용 JSON

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
