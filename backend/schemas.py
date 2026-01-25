from pydantic import BaseModel, Field
from typing import List

# --- 1. 데이터 모델 정의 (Pydantic) ---

class AnalyzeRequest(BaseModel):
    github_username: str
    selected_repos: List[str]


# Gemini가 뱉어낼 '3가지 관점'의 정해진 형식
class RepoAnalysisResult(BaseModel):
    repo_name: str = Field(description="분석한 레포지토리 이름")
    tech_view: str = Field(description="기술 및 아키텍처 관점 분석 (Agent A)")
    stability_view: str = Field(description="안정성 및 유지보수 관점 분석 (Agent B)")
    comm_view: str = Field(description="소통 및 컨벤션 관점 분석 (Agent C)")
    summary: str = Field(description="이 레포지토리의 종합 요약")
