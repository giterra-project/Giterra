from pydantic import BaseModel, Field
from typing import List, Optional, Generic, TypeVar


# 1. 제네릭 타입 변수 T 선언 (어떤 데이터든 들어올 수 있다는 뜻)
T = TypeVar("T")

# 2. 만능 껍데기 BaseResponse 정의
class BaseResponse(BaseModel, Generic[T]):
    code: int
    message: str
    data: Optional[T] = None 

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

class RepoInfo(BaseModel):
    repo_id: int
    name: str
    description: Optional[str]
    stars: int
    language: Optional[str]
    url: str
    updated_at: str

# --- 2. 행성 배치 관련 (Planet Placement) ---

class PlanetPlacementItem(BaseModel):
    repo_id: int
    slot_index: int
    planet_type: str

class PlanetPlacementRequest(BaseModel):
    placements: List[PlanetPlacementItem]
    mode: str = "replace" # 기본값 replace

class PlanetPlacementResponse(BaseModel):
    code: int = 200
    message: str = "placements updated"
    data: dict

# 1. 가장 안쪽 데이터: 행성(레포지토리) 정보
class PlanetInfo(BaseModel):
    repoId: int
    slot: int
    repoName: str
    repoURL: str
    description: Optional[str] = None # 설명이 없는 레포도 있으니 Optional 처리

class RepoListInfo(BaseModel): 
    repoId: int
    repoName: str
    repoURL: str
    description: Optional[str] = None

class MyRepositories(BaseModel): 
    repos: list[RepoListInfo]

# 2. 중간 데이터: 유저 프로필 본문
class UserProfileData(BaseModel):
    userId: int
    username: str
    githubURL: str
    planets: List[PlanetInfo]

class UpdatePlanetRequest(BaseModel): 
    repos: List[str]

class RepositoryResult(BaseModel): 
    repoName: str
    repoURL: str
    planetType: str
    repoSummary: str
    aspect_1: str
    aspect_2: str
    aspect_3: str

class AnalyzeResult(BaseModel): 
    summary: str
    planets: List[RepositoryResult]