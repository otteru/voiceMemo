"""Return Zero STT 프로바이더"""

import asyncio
import json
from datetime import datetime
from typing import AsyncGenerator, Dict, Any, Optional

import httpx
import websockets

from app.services.stt.base import STTProvider


class ReturnZeroProvider(STTProvider):
    """Return Zero 스트리밍 STT 프로바이더"""

    AUTH_URL = "https://openapi.vito.ai/v1/authenticate"
    WEBSOCKET_URL = "wss://openapi.vito.ai/v1/transcribe:streaming"

    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token: Optional[str] = None
        self.token_expire_at: Optional[datetime] = None

    async def _get_token(self) -> str:
        """JWT 토큰 발급 (6시간 캐싱)"""
        if self.access_token and self.token_expire_at:
            if datetime.now() < self.token_expire_at:
                return self.access_token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.AUTH_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()

            data = response.json()
            token: str = data["access_token"]
            self.access_token = token
            self.token_expire_at = datetime.fromtimestamp(data["expire_at"] / 1000)
            return token

    async def stream_transcribe(
        self,
        audio_stream: AsyncGenerator[bytes, None],
        sample_rate: int = 24000,
        encoding: str = "LINEAR16",
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """실시간 스트리밍 STT (정규화된 결과 반환)"""
        token = await self._get_token()

        ws_url = (
            f"{self.WEBSOCKET_URL}"
            f"?sample_rate={sample_rate}"
            f"&encoding={encoding}"
            f"&use_itn=true"
            f"&use_disfluency_filter=true"
        )

        async with websockets.connect(
            ws_url,
            extra_headers={"Authorization": f"Bearer {token}"},
        ) as ws:

            async def send_audio():
                try:
                    async for chunk in audio_stream:
                        await ws.send(chunk)
                    await ws.send("EOS")
                except Exception as e:
                    print(f"Return Zero 오디오 전송 오류: {e}")

            async def receive_results():
                try:
                    async for message in ws:
                        result = json.loads(message)
                        alternatives = result.get("alternatives", [])
                        text = alternatives[0].get("text", "") if alternatives else ""
                        yield {
                            "seq": result.get("seq", 0),
                            "final": result.get("final", False),
                            "text": text,
                            "start_at": result.get("start_at", 0),
                            "duration": result.get("duration", 0),
                        }
                except Exception as e:
                    print(f"Return Zero 결과 수신 오류: {e}")

            send_task = asyncio.create_task(send_audio())

            async for result in receive_results():
                yield result

            await send_task

    async def transcribe_file(
        self,
        audio_file_path: str,
        chunk_size: int = 1024,
        sample_rate: int = 24000,
        encoding: str = "LINEAR16",
    ) -> list[Dict[str, Any]]:
        """오디오 파일을 스트리밍으로 전사 (테스트/유틸용)"""

        async def file_stream():
            with open(audio_file_path, "rb") as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk

        results = []
        async for result in self.stream_transcribe(
            file_stream(),
            sample_rate=sample_rate,
            encoding=encoding,
        ):
            results.append(result)
            if result.get("final") and result.get("text"):
                print(f"  {result['text']}")

        return results
