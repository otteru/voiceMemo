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

    # 파일 저장 경로
    output_dir: str = "outputs"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
