"""
Notion API Pydantic 스키마
"""

from pydantic import BaseModel, Field


class NotionConfigRequest(BaseModel):
    """Notion 설정 저장 요청"""

    token: str = Field(..., min_length=1, description="Notion Integration Token")
    page_url: str = Field(
        ..., min_length=1, alias="pageUrl", description="Notion 페이지 URL"
    )

    model_config = {"populate_by_name": True}


class NotionConfigResponse(BaseModel):
    """Notion 설정 저장 응답"""

    success: bool


class NotionStatusResponse(BaseModel):
    """Notion 연결 상태 응답"""

    connected: bool


class NotionSaveRequest(BaseModel):
    """Notion 저장 요청"""

    recording_id: str = Field(..., alias="recordingId", description="녹음 ID")
    summary: str = Field(..., min_length=1, description="AI 요약 내용")
    title: str = Field(..., min_length=1, description="페이지 제목")

    model_config = {"populate_by_name": True}


class NotionSaveResponse(BaseModel):
    """Notion 저장 응답"""

    url: str
