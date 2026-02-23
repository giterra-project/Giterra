import asyncio
import sys

# Windows에서 asyncpg 호환성 (ProactorEventLoop → SelectorEventLoop)
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
# from app.services.graph import langgraph_app 제미나이 API 키 있어야함
from app.routers import repo
from app.routers import analyze
from app.routers import auth

from contextlib import asynccontextmanager
from app.database import init_db
import app.models as models # 모델들을 임포트해야 테이블이 생성됩니다.

from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi.security import APIKeyHeader

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 기동 시 DB 테이블 생성
    await init_db()
    yield

# Swagger UI 보안 설정 (자물쇠 버튼 추가)
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

app = FastAPI(
    title="Giterra Backend", 
    lifespan=lifespan,
    dependencies=[Depends(api_key_header)], # 전역 의존성 추가로 Swagger 자물쇠 활성화
    swagger_ui_parameters={"persistAuthorization": True}
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 분리된 Auth 라우터 등록
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# app.include_router(langgraph_app, prefix="/langgraph", tags=["Language Graph"])
app.include_router(repo.router, prefix="/repos", tags=["Repositories"])
app.include_router(analyze.router, prefix="/analyze", tags=["Analysis"])

# API 엔드포인트

@app.get("/")
async def root():
    return {"message": "Giterra API Server is running!"}

