from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """환경변수 설정"""

    # Return Zero API
    return_zero_client_id: str
    return_zero_client_secret: str

    # OpenRouter API
    openrouter_api_key: str

    # Notion API
    notion_api_key: str
    notion_page_url: Optional[str] = None  # 기본 페이지 URL (선택)

    # FastAPI 세션 관리
    session_secret_key: str = "your-secret-key-change-in-production"  # 프로덕션에서는 반드시 변경

    # 데이터베이스
    database_url: str = "sqlite+aiosqlite:///./voicememo.db"

    # 파일 저장 경로
    output_dir: str = "outputs"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
