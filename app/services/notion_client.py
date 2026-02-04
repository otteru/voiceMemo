"""Notion API 클라이언트"""
import re
from typing import Optional, List, Dict, Any
from notion_client import Client
from app.core.config import settings


class NotionService:
    """Notion API 서비스"""

    def __init__(self):
        """Notion 클라이언트 초기화"""
        self.client = Client(auth=settings.notion_api_key)

    def extract_page_id(self, url: str) -> str:
        """
        Notion URL에서 페이지 ID 추출

        Args:
            url: Notion 페이지 URL

        Returns:
            32자리 페이지 ID

        Examples:
            >>> extract_page_id("https://www.notion.so/Page-Name-abc123def456...")
            "abc123def456..."
        """
        # URL에서 32자리 ID 추출 (하이픈 포함 가능)
        # 예: 2fc210261e9580f8b20edd77d72a8aa6
        pattern = r'([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})'
        match = re.search(pattern, url)

        if not match:
            raise ValueError(f"유효하지 않은 Notion URL: {url}")

        page_id = match.group(1)
        # 하이픈 제거
        return page_id.replace("-", "")

    def create_page(
        self,
        parent_page_url: str,
        title: str,
        blocks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Notion 페이지 생성

        Args:
            parent_page_url: 부모 페이지 URL
            title: 페이지 제목
            blocks: 페이지 내용 블록 리스트

        Returns:
            생성된 페이지 정보
        """
        page_id = self.extract_page_id(parent_page_url)

        response = self.client.pages.create(
            parent={"page_id": page_id},
            properties={
                "title": {
                    "title": [
                        {
                            "type": "text",
                            "text": {"content": title}
                        }
                    ]
                }
            },
            children=blocks
        )

        return response

    def create_lecture_page(
        self,
        title: str,
        summary: str,
        parent_page_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        강의 노트 페이지 생성

        Args:
            title: 강의 제목
            summary: LLM이 생성한 강의 요약
            parent_page_url: 부모 페이지 URL (없으면 환경변수 사용)

        Returns:
            생성된 페이지 정보
        """
        # 부모 페이지 URL 결정
        if parent_page_url is None:
            if settings.notion_page_url is None:
                raise ValueError("parent_page_url을 제공하거나 NOTION_PAGE_URL 환경변수를 설정하세요")
            parent_page_url = settings.notion_page_url

        # 요약 내용을 Notion 블록으로 변환
        blocks = self._convert_summary_to_blocks(summary)

        # 페이지 생성
        return self.create_page(
            parent_page_url=parent_page_url,
            title=title,
            blocks=blocks
        )

    def _convert_summary_to_blocks(self, summary: str) -> List[Dict[str, Any]]:
        """
        텍스트 요약을 Notion 블록으로 변환

        Args:
            summary: LLM 요약 텍스트

        Returns:
            Notion 블록 리스트
        """
        blocks = []
        lines = summary.split('\n')

        for line in lines:
            line = line.strip()

            if not line:
                continue

            # 제목 형식 감지 (##, ###)
            if line.startswith('### '):
                blocks.append({
                    "object": "block",
                    "type": "heading_3",
                    "heading_3": {
                        "rich_text": [{"type": "text", "text": {"content": line[4:]}}]
                    }
                })
            elif line.startswith('## '):
                blocks.append({
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": line[3:]}}]
                    }
                })
            elif line.startswith('# '):
                blocks.append({
                    "object": "block",
                    "type": "heading_1",
                    "heading_1": {
                        "rich_text": [{"type": "text", "text": {"content": line[2:]}}]
                    }
                })
            # 리스트 항목 (-, *, 숫자.)
            elif line.startswith('- ') or line.startswith('* '):
                blocks.append({
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": line[2:]}}]
                    }
                })
            elif re.match(r'^\d+\.\s', line):
                # 숫자. 형식
                content = re.sub(r'^\d+\.\s', '', line)
                blocks.append({
                    "object": "block",
                    "type": "numbered_list_item",
                    "numbered_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": content}}]
                    }
                })
            else:
                # 일반 단락
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": line}}]
                    }
                })

        return blocks
