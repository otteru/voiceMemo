"""
데이터베이스 설정 및 세션 관리
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


# SQLAlchemy Base 클래스
class Base(DeclarativeBase):
    """SQLAlchemy ORM Base 클래스"""

    pass


# 비동기 엔진 생성
engine = create_async_engine(
    settings.database_url,
    echo=True,  # SQL 쿼리 로그 출력 (개발 환경)
    future=True,
)

# 비동기 세션 팩토리
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# 의존성 주입용 DB 세션
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI 의존성 주입용 DB 세션

    Yields:
        AsyncSession: 비동기 DB 세션
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# 데이터베이스 초기화
async def init_db() -> None:
    """
    데이터베이스 테이블 생성

    개발 환경에서만 사용. 프로덕션에서는 Alembic 마이그레이션 사용.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# 데이터베이스 종료
async def close_db() -> None:
    """데이터베이스 연결 종료"""
    await engine.dispose()
