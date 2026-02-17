"""STT 프로바이더 팩토리"""

from app.services.stt.base import STTProvider
from app.core.config import settings


def get_stt_provider() -> STTProvider:
    """환경변수 STT_PROVIDER에 따라 STT 프로바이더 반환"""
    provider = settings.stt_provider

    if provider == "openai":
        from app.services.stt.openai_realtime import OpenAIRealtimeProvider

        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY 환경변수가 필요합니다")
        return OpenAIRealtimeProvider(api_key=settings.openai_api_key)

    elif provider == "return_zero":
        from app.services.stt.return_zero import ReturnZeroProvider

        if not settings.return_zero_client_id or not settings.return_zero_client_secret:
            raise ValueError(
                "RETURN_ZERO_CLIENT_ID / RETURN_ZERO_CLIENT_SECRET 환경변수가 필요합니다"
            )
        return ReturnZeroProvider(
            client_id=settings.return_zero_client_id,
            client_secret=settings.return_zero_client_secret,
        )

    raise ValueError(f"지원하지 않는 STT 프로바이더: {provider}")
