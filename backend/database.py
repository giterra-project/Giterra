from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# .env에서 DATABASE_URL을 가져오거나 기본값 사용
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://myuser:mypassword@localhost:5432/giterra")

# 비동기 엔진 생성
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# 비동기 세션 생성기
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# DB 초기화 함수 (테이블 생성 등)
async def init_db():
    async with engine.begin() as conn:
        # SQLModel에 정의된 모든 모델을 기반으로 테이블 생성
        # await conn.run_sync(SQLModel.metadata.drop_all) # 초기화가 필요할 때만 사용
        await conn.run_sync(SQLModel.metadata.create_all)

# FastAPI Dependency Injection용 함수
async def get_session():
    async with async_session() as session:
        yield session
