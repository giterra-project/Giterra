from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    github_id: str = Field(unique=True, index=True) # 깃허브 ID (중복불가)
    username: str # 유저 닉네임
    avatar_url: Optional[str] = None
    html_url: Optional[str] = None
    access_token: Optional[str] = None
    
    # 관계 설정
    repositories: List["Repository"] = Relationship(back_populates="owner")
    placements: List["Placement"] = Relationship(back_populates="user")

class Repository(SQLModel, table=True):
    __tablename__ = "repositories"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    name: str # 레포지토리 이름
    
    analysis_type: Optional[str] = None # A/B/C/D 타입
    analysis_summary: Optional[str] = Field(default=None) # 분석 요약
    analysis_sub1: Optional[str] = None
    analysis_sub2: Optional[str] = None
    analysis_sub3: Optional[str] = None
    
    last_analyzed: Optional[datetime] = Field(default_factory=datetime.now)
    latest_commit: Optional[datetime] = None
    
    # 관계 설정
    owner: User = Relationship(back_populates="repositories")
    placement: Optional["Placement"] = Relationship(back_populates="repository")

class Placement(SQLModel, table=True):
    __tablename__ = "placements"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    repo_id: int = Field(foreign_key="repositories.id", unique=True)
    slot_index: int # 0~7번 구역 인덱스
    
    # 관계 설정
    user: User = Relationship(back_populates="placements")
    repository: Repository = Relationship(back_populates="placement")
