"""
Recording API Pydantic 스키마
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RecordingCreateResponse(BaseModel):
    """녹음 생성 응답"""

    id: str
    status: str
    message: str


class RecordingStatusResponse(BaseModel):
    """녹음 처리 상태 응답"""

    status: str
    progress: int


class RecordingResponse(BaseModel):
    """녹음 상세 응답"""

    id: str
    title: str
    duration: int = 0
    stt_text: Optional[str] = Field(None, alias="sttText")
    summary: Optional[str] = None
    notion_url: Optional[str] = Field(None, alias="notionUrl")
    status: str = "idle"
    progress: int = 0
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}
