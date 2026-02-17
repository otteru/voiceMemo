"""
보고서 API 라우터 (실시간 모드 전용)
"""

from fastapi import APIRouter, HTTPException

from app.schemas.report import (
    ProgressiveReportRequest,
    ProgressiveReportResponse,
)
from app.services.llm_summarizer import LectureSummarizer

router = APIRouter()


@router.post("/progressive", response_model=ProgressiveReportResponse)
async def progressive_report(
    body: ProgressiveReportRequest,
) -> ProgressiveReportResponse:
    """점진적 보고서: 새 STT 텍스트 + 이전 보고서 → 갱신된 보고서"""
    try:
        summarizer = LectureSummarizer()
        report = await summarizer.generate_progressive_report_async(
            transcript_chunk=body.transcript_chunk,
            previous_report=body.previous_report,
            chunk_index=body.chunk_index,
        )
        return ProgressiveReportResponse(
            report=report,
            chunk_index=body.chunk_index,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"보고서 생성 실패: {e}")
