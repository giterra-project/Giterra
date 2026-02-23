from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True) # Github ID
    avatar_url: Optional[str] = None
    html_url: Optional[str] = None
    access_token: Optional[str] = None
    
    # 관계 설정
    repositories: List["Repository"] = Relationship(back_populates="owner")
    placements: List["Planet"] = Relationship(back_populates="user")

class Repository(SQLModel, table=True):
    __tablename__ = "repositories"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    repo_name: str # 레포지토리 이름
    description: Optional[str] = None # 레포지토리 설명
    planet_type: Optional[str] = None # 보여질 행성타입
    analysis_summary: Optional[str] = Field(default=None) # 분석 요약
    analysis_sub1: Optional[str] = None
    analysis_sub2: Optional[str] = None
    analysis_sub3: Optional[str] = None
    
    last_analyzed: Optional[datetime] = Field(default_factory=datetime.now)
    latest_commit: Optional[datetime] = None
    
    # 관계 설정
    owner: User = Relationship(back_populates="repositories")
    planets: Optional["Planet"] = Relationship(back_populates="repository")

class Planet(SQLModel, table=True):
    __tablename__ = "Planets"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    repo_id: int = Field(foreign_key="repositories.id", unique=True)
    slot_index: int # 0~7번 행성 인덱스
    
    # 관계 설정
    user: User = Relationship(back_populates="planets")
    repository: Repository = Relationship(back_populates="planets")
