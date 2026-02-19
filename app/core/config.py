from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """환경변수 설정"""

    # STT 프로바이더 선택: "return_zero" | "openai" | "whisper_live"
    stt_provider: str = "whisper_live"

    # Return Zero API
    return_zero_client_id: Optional[str] = None
    return_zero_client_secret: Optional[str] = None

    # OpenAI API (Realtime Transcription)
    openai_api_key: Optional[str] = None

    # WhisperLive (로컬 서버)
    whisper_live_server_url: str = "ws://localhost:9090/asr"
    whisper_live_recv_timeout: int = 15

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
