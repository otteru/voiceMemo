"""
보고서 API Pydantic 스키마
"""

from typing import Optional

from pydantic import BaseModel, Field


class ProgressiveReportRequest(BaseModel):
    """점진적 보고서 요청 (우측 패널용, 3~5분마다 갱신)"""

    transcript_chunk: str = Field(
        ..., min_length=1, alias="transcriptChunk"
    )
    previous_report: Optional[str] = Field(None, alias="previousReport")
    chunk_index: int = Field(0, alias="chunkIndex")

    model_config = {"populate_by_name": True}


class ProgressiveReportResponse(BaseModel):
    """점진적 보고서 응답"""

    report: str
    chunk_index: int = Field(alias="chunkIndex")

    model_config = {"populate_by_name": True}


