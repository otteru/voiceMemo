"""
FastAPI 메인 애플리케이션
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.routes import notion, recordings
from app.core.config import settings
from app.core.database import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """앱 시작/종료 시 DB 초기화/정리"""
    await init_db()
    yield
    await close_db()

# FastAPI 앱 생성
app = FastAPI(
    title="Voice Memo API",
    description="강의 녹음 자동 정리 서비스",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js 개발 서버
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,  # httpOnly 쿠키 허용
    allow_methods=["*"],
    allow_headers=["*"],
)

# 세션 미들웨어 (httpOnly 쿠키 세션 관리)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret_key,
    max_age=7 * 24 * 60 * 60,  # 7일
    same_site="lax",
    https_only=False,  # 개발 환경에서는 False, 프로덕션에서는 True
)


# Health Check 엔드포인트
@app.get("/")
async def root():
    """API 상태 확인"""
    return {
        "status": "ok",
        "message": "Voice Memo API is running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


# 라우터 등록
app.include_router(recordings.router, prefix="/api/recordings", tags=["recordings"])
app.include_router(notion.router, prefix="/api/notion", tags=["notion"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 개발 모드
    )
