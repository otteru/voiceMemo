"""
Recording 데이터베이스 모델
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Recording(Base):
    """녹음 기록 모델"""

    __tablename__ = "recordings"

    # Primary Key
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # 기본 정보
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    duration: Mapped[int] = mapped_column(Integer, default=0)  # 초 단위

    # 파일 경로
    audio_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # STT 결과
    stt_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # AI 요약 결과
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Notion URL
    notion_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # 처리 상태 (idle, stt, ai, notion, complete)
    status: Mapped[str] = mapped_column(String(50), default="idle", nullable=False)

    # 진행률 (0-100)
    progress: Mapped[int] = mapped_column(Integer, default=0)

    # 타임스탬프
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Recording(id={self.id}, title={self.title}, status={self.status})>"
