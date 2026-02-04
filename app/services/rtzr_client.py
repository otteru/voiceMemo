import httpx
import websockets
import json
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator
from datetime import datetime


class RTZRClient:
    """Return Zero 스트리밍 STT API 클라이언트"""

    AUTH_URL = "https://openapi.vito.ai/v1/authenticate"
    WEBSOCKET_URL = "wss://openapi.vito.ai/v1/transcribe:streaming"

    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token: Optional[str] = None
        self.token_expire_at: Optional[datetime] = None

    async def _get_token(self) -> str:
        """
        JWT 토큰 발급
        토큰 유효기간: 6시간
        """
        # 토큰이 유효하면 재사용
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
            self.access_token = data["access_token"]
            # expire_at은 타임스탬프 (밀리초)
            self.token_expire_at = datetime.fromtimestamp(data["expire_at"] / 1000)

            print(f"✅ 토큰 발급 완료 (만료: {self.token_expire_at})")
            return self.access_token

    async def stream_transcribe(
        self,
        audio_stream: AsyncGenerator[bytes, None],
        sample_rate: int = 16000,
        encoding: str = "LINEAR16",
        use_itn: bool = True,
        use_disfluency_filter: bool = False,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        실시간 스트리밍 STT

        Args:
            audio_stream: 오디오 데이터 스트림 (비동기 제너레이터)
            sample_rate: 샘플링 레이트 (8000~48000 Hz)
            encoding: 오디오 인코딩 (LINEAR16, FLAC, OPUS 등)
            use_itn: 역정규화 사용 (숫자를 아라비아 숫자로)
            use_disfluency_filter: 불안정 필터 (음, 어 등 제거)

        Yields:
            STT 결과 (JSON)
        """
        token = await self._get_token()

        # WebSocket URL에 쿼리 파라미터 추가
        ws_url = (
            f"{self.WEBSOCKET_URL}"
            f"?sample_rate={sample_rate}"
            f"&encoding={encoding}"
            f"&use_itn={'true' if use_itn else 'false'}"
            f"&use_disfluency_filter={'true' if use_disfluency_filter else 'false'}"
        )

        # WebSocket 연결
        async with websockets.connect(
            ws_url,
            extra_headers={"Authorization": f"Bearer {token}"},
        ) as websocket:
            print("✅ WebSocket 연결 완료")

            # 오디오 전송 태스크
            async def send_audio():
                try:
                    async for audio_chunk in audio_stream:
                        # 바이너리 메시지로 오디오 전송
                        await websocket.send(audio_chunk)

                    # 스트림 종료 신호
                    await websocket.send("EOS")
                    print("✅ 오디오 전송 완료 (EOS)")
                except Exception as e:
                    print(f"❌ 오디오 전송 오류: {e}")

            # 결과 수신 태스크
            async def receive_results():
                try:
                    async for message in websocket:
                        result = json.loads(message)
                        yield result
                except Exception as e:
                    print(f"❌ 결과 수신 오류: {e}")

            # 동시 실행
            send_task = asyncio.create_task(send_audio())

            async for result in receive_results():
                yield result

            await send_task

    async def transcribe_file(
        self,
        audio_file_path: str,
        chunk_size: int = 1024,
        sample_rate: int = 16000,
        encoding: str = "LINEAR16",
    ) -> list[Dict[str, Any]]:
        """
        오디오 파일을 스트리밍으로 전사

        Args:
            audio_file_path: 오디오 파일 경로
            chunk_size: 청크 크기 (바이트)
            sample_rate: 샘플링 레이트
            encoding: 오디오 인코딩

        Returns:
            전사 결과 리스트
        """
        async def file_stream():
            """파일을 청크로 읽어서 스트림으로 전달"""
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

            # final=True인 결과만 출력
            if result.get("final"):
                text = result.get("alternatives", [{}])[0].get("text", "")
                print(f"📝 {text}")

        return results
