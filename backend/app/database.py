from sqlmodel import SQLModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# 비동기 엔진 생성
engine = create_async_engine(
    DATABASE_URL, 
    echo=True, 
    future=True,
)

# 비동기 세션 생성기
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# DB 초기화 함수 (테이블 생성 등)
async def ensure_schema_compatibility(conn):
    """기존 로컬 DB를 현재 SQLModel 스키마와 맞춥니다.

    SQLModel.metadata.create_all()은 이미 존재하는 테이블에 새 컬럼을 추가하지 않습니다.
    개발 중 모델 필드가 바뀐 경우 기존 로컬 DB에서 500이 발생하지 않도록,
    누락 컬럼만 보강하는 가벼운 호환 마이그레이션을 수행합니다.
    """

    existing_columns = {
        row[0]
        for row in (
            await conn.execute(
                text(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'repositories'
                    """
                )
            )
        )
    }

    await conn.execute(
        text(
            """
            ALTER TABLE repositories
            ADD COLUMN IF NOT EXISTS github_repo_id INTEGER,
            ADD COLUMN IF NOT EXISTS repo_name VARCHAR,
            ADD COLUMN IF NOT EXISTS html_url VARCHAR,
            ADD COLUMN IF NOT EXISTS description VARCHAR,
            ADD COLUMN IF NOT EXISTS planet_type VARCHAR
            """
        )
    )

    # 예전 스키마의 name / analysis_type 값을 가능한 범위에서 새 컬럼으로 보존합니다.
    if "name" in existing_columns:
        await conn.execute(text("ALTER TABLE repositories ALTER COLUMN name DROP NOT NULL"))
        await conn.execute(
            text(
                """
                UPDATE repositories
                SET repo_name = COALESCE(repo_name, name)
                WHERE repo_name IS NULL
                """
            )
        )

    if "analysis_type" in existing_columns:
        await conn.execute(
            text(
                """
                UPDATE repositories
                SET planet_type = COALESCE(planet_type, analysis_type)
                WHERE planet_type IS NULL
                """
            )
        )

    await conn.execute(
        text(
            """
            UPDATE repositories
            SET html_url = COALESCE(html_url, '')
            WHERE html_url IS NULL
            """
        )
    )


async def init_db():
    async with engine.begin() as conn:
        # SQLModel에 정의된 모든 모델을 기반으로 테이블 생성
        # await conn.run_sync(SQLModel.metadata.drop_all) # 초기화가 필요할 때만 사용
        await conn.run_sync(SQLModel.metadata.create_all)
        await ensure_schema_compatibility(conn)

# FastAPI Dependency Injection용 함수
async def get_session():
    async with async_session() as session:
        yield session
