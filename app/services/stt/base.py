"""STT 프로바이더 추상 인터페이스"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any


class STTProvider(ABC):
    """
    STT 프로바이더 공통 인터페이스

    모든 프로바이더는 동일한 형식의 결과를 yield해야 합니다:
    {
        "seq": int,          # 시퀀스 번호
        "final": bool,       # 확정 결과 여부
        "text": str,         # 전사 텍스트
        "start_at": int,     # 시작 시간 (ms)
        "duration": int,     # 지속 시간 (ms)
    }
    """

    @abstractmethod
    async def stream_transcribe(
        self,
        audio_stream: AsyncGenerator[bytes, None],
        sample_rate: int = 24000,
        encoding: str = "LINEAR16",
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """실시간 스트리밍 STT"""
        ...
        yield  # type: ignore[misc]
