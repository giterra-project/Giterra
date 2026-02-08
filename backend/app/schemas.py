from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional

# --- 1. 데이터 모델 정의 (Pydantic) ---

class AnalyzeRequest(BaseModel):
    github_username: str
    selected_repos: List[str]


class AnalyzeDirectRequest(BaseModel):
    github_username: str = Field(min_length=1, description="GitHub username")
    selected_repos: List[str] = Field(min_length=1, max_length=20, description="Selected repository names")
    mode: Optional[Literal["single", "multi"]] = None


# Gemini가 뱉어낼 '3가지 관점'의 정해진 형식
class RepoAnalysisResult(BaseModel):
    repo_name: str = Field(description="분석한 레포지토리 이름")
    tech_view: str = Field(description="기술 및 아키텍처 관점 분석 (Agent A)")
    stability_view: str = Field(description="안정성 및 유지보수 관점 분석 (Agent B)")
    comm_view: str = Field(description="소통 및 컨벤션 관점 분석 (Agent C)")
    summary: str = Field(description="이 레포지토리의 종합 요약")

class RepoInfo(BaseModel):
    name: str
    description: Optional[str]
    stars: int
    language: Optional[str]
    url: str
    updated_at: str


class DirectRepoAnalysis(BaseModel):
    repo_name: str
    total_commits: int
    dominant_type: str
    building_type: str
    top_languages: List[str]
    latest_commit: Optional[str]
    analysis_summary: str
    analysis_sub1: str
    analysis_sub2: str
    analysis_sub3: str


class DirectAnalyzeSummary(BaseModel):
    username: str
    mode: Literal["single", "multi"]
    repo_count: int
    persona: str
    theme: str
    main_languages: List[str]
    total_score: float
    commit_stats: Dict[str, int]
    weighted_scores: Dict[str, float]
    overall_analysis: str
    analysis_source: Literal["llm", "heuristic"]
    generated_at: str


class DirectAnalyzeResponse(BaseModel):
    summary: DirectAnalyzeSummary
    repositories: List[DirectRepoAnalysis]
    failed_repositories: List[str] = Field(default_factory=list)
