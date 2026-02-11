"""
Notion API 라우터
"""

from fastapi import APIRouter, Request, HTTPException

from app.core.security import session_manager
from app.schemas.notion import (
    NotionConfigRequest,
    NotionConfigResponse,
    NotionSaveRequest,
    NotionSaveResponse,
    NotionStatusResponse,
)
from app.services.notion_client import NotionService

router = APIRouter()


@router.get("/status", response_model=NotionStatusResponse)
async def get_notion_status(request: Request) -> NotionStatusResponse:
    """Notion 연결 상태 확인"""
    connected = session_manager.is_notion_connected(request)
    return NotionStatusResponse(connected=connected)


@router.post("/config", response_model=NotionConfigResponse)
async def save_notion_config(
    request: Request, body: NotionConfigRequest
) -> NotionConfigResponse:
    """Notion 설정을 세션에 저장 (httpOnly 쿠키)"""
    try:
        # 토큰 유효성 검증: Notion API 호출 테스트
        service = NotionService(token=body.token)
        service.client.users.me()
    except Exception:
        raise HTTPException(status_code=400, detail="유효하지 않은 Notion 토큰입니다")

    # URL에서 page_id 추출
    try:
        page_id = service.extract_page_id(body.page_url)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="유효하지 않은 Notion URL입니다. 페이지 URL을 확인해주세요",
        )

    session_manager.set_notion_config(request, body.token, page_id)
    return NotionConfigResponse(success=True)


@router.post("/disconnect", response_model=NotionConfigResponse)
async def disconnect_notion(request: Request) -> NotionConfigResponse:
    """Notion 연결 해제 (세션 삭제)"""
    session_manager.clear_notion_config(request)
    return NotionConfigResponse(success=True)


@router.post("/save", response_model=NotionSaveResponse)
async def save_to_notion(
    request: Request, body: NotionSaveRequest
) -> NotionSaveResponse:
    """요약 내용을 Notion 페이지로 저장"""
    token = session_manager.get_notion_token(request)
    page_id = session_manager.get_notion_page_id(request)

    if not token or not page_id:
        raise HTTPException(status_code=401, detail="Notion이 연결되지 않았습니다")

    try:
        service = NotionService(token=token)
        result = service.create_lecture_page(
            title=body.title,
            summary=body.summary,
            parent_page_id=page_id,
        )
        page_url = result.get("url", "")
        return NotionSaveResponse(url=page_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notion 저장 실패: {e}")
