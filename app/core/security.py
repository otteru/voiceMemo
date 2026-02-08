"""
세션 관리 및 보안 유틸리티
"""

from typing import Optional
from fastapi import Request


class SessionManager:
    """httpOnly 쿠키 세션 관리"""

    # 세션 키 상수
    NOTION_TOKEN_KEY = "notion_token"
    NOTION_DATABASE_ID_KEY = "notion_database_id"

    @staticmethod
    def set_notion_config(request: Request, token: str, database_id: str) -> None:
        """
        Notion 설정을 세션에 저장

        Args:
            request: FastAPI Request 객체
            token: Notion Integration Token
            database_id: Notion Database ID
        """
        request.session[SessionManager.NOTION_TOKEN_KEY] = token
        request.session[SessionManager.NOTION_DATABASE_ID_KEY] = database_id

    @staticmethod
    def get_notion_token(request: Request) -> Optional[str]:
        """
        세션에서 Notion 토큰 조회

        Args:
            request: FastAPI Request 객체

        Returns:
            Notion 토큰 또는 None
        """
        return request.session.get(SessionManager.NOTION_TOKEN_KEY)

    @staticmethod
    def get_notion_database_id(request: Request) -> Optional[str]:
        """
        세션에서 Notion Database ID 조회

        Args:
            request: FastAPI Request 객체

        Returns:
            Notion Database ID 또는 None
        """
        return request.session.get(SessionManager.NOTION_DATABASE_ID_KEY)

    @staticmethod
    def get_notion_config(request: Request) -> tuple[Optional[str], Optional[str]]:
        """
        세션에서 Notion 설정 조회

        Args:
            request: FastAPI Request 객체

        Returns:
            (token, database_id) 튜플
        """
        token = SessionManager.get_notion_token(request)
        database_id = SessionManager.get_notion_database_id(request)
        return token, database_id

    @staticmethod
    def is_notion_connected(request: Request) -> bool:
        """
        Notion 연결 상태 확인

        Args:
            request: FastAPI Request 객체

        Returns:
            연결 여부
        """
        token = SessionManager.get_notion_token(request)
        database_id = SessionManager.get_notion_database_id(request)
        return token is not None and database_id is not None

    @staticmethod
    def clear_notion_config(request: Request) -> None:
        """
        세션에서 Notion 설정 삭제

        Args:
            request: FastAPI Request 객체
        """
        request.session.pop(SessionManager.NOTION_TOKEN_KEY, None)
        request.session.pop(SessionManager.NOTION_DATABASE_ID_KEY, None)

    @staticmethod
    def clear_all(request: Request) -> None:
        """
        세션 전체 삭제

        Args:
            request: FastAPI Request 객체
        """
        request.session.clear()


# 싱글톤 인스턴스
session_manager = SessionManager()
