"""OpenAI Realtime Transcription STT 프로바이더"""

import asyncio
import base64
import json
from typing import AsyncGenerator, Dict, Any, Optional

import websockets

from app.services.stt.base import STTProvider


class OpenAIRealtimeProvider(STTProvider):
    """OpenAI Realtime Transcription API 프로바이더"""

    WEBSOCKET_URL = "wss://api.openai.com/v1/realtime"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini-transcribe"):
        self.api_key = api_key
        self.model = model

    async def stream_transcribe(
        self,
        audio_stream: AsyncGenerator[bytes, None],
        sample_rate: int = 24000,
        encoding: str = "LINEAR16",
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """OpenAI Realtime API를 사용한 스트리밍 STT"""
        url = f"{self.WEBSOCKET_URL}?intent=transcription"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        async with websockets.connect(
            url,
            extra_headers=headers,
        ) as ws:
            # 세션 설정 (공식 문서 구조)
            await ws.send(json.dumps({
                "type": "session.update",
                "session": {
                    "type": "transcription",
                    "audio": {
                        "input": {
                            "format": {
                                "type": "audio/pcm",
                                "rate": sample_rate,
                            },
                            "transcription": {
                                "model": self.model,
                                "language": "ko",
                            },
                            "turn_detection": {
                                "type": "server_vad",
                                "threshold": 0.5,
                                "silence_duration_ms": 800,
                                "prefix_padding_ms": 300,
                            },
                            "noise_reduction": {"type": "near_field"},
                        },
                    },
                },
            }))

            # 내부 상태
            seq_counter = 0
            item_seq_map: Dict[str, int] = {}
            item_delta_buf: Dict[str, str] = {}
            result_queue: asyncio.Queue[Optional[Dict[str, Any]]] = asyncio.Queue()
            send_done = asyncio.Event()  # send_audio 완료 신호

            async def send_audio():
                """오디오 청크를 base64로 인코딩하여 전송"""
                try:
                    async for chunk in audio_stream:
                        audio_b64 = base64.b64encode(chunk).decode()
                        await ws.send(json.dumps({
                            "type": "input_audio_buffer.append",
                            "audio": audio_b64,
                        }))
                    # 오디오 전송 완료 → 버퍼에 남은 오디오 처리 요청
                    # server_vad가 이미 커밋했으면 빈 버퍼 에러가 오지만 무해함
                    try:
                        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
                    except websockets.exceptions.ConnectionClosed:
                        pass
                except websockets.exceptions.ConnectionClosed:
                    pass
                except Exception as e:
                    print(f"OpenAI 오디오 전송 오류: {e}")
                finally:
                    send_done.set()  # 오디오 전송 완료 알림

            async def receive_results():
                """OpenAI 이벤트 수신 및 정규화"""
                nonlocal seq_counter
                try:
                    async for message in ws:
                        event = json.loads(message)
                        event_type = event.get("type", "")

                        if event_type == "input_audio_buffer.committed":
                            item_id = event.get("item_id", "")
                            seq_counter += 1
                            item_seq_map[item_id] = seq_counter
                            item_delta_buf[item_id] = ""

                        elif event_type == "conversation.item.input_audio_transcription.delta":
                            item_id = event.get("item_id", "")
                            delta = event.get("delta", "")
                            if item_id in item_delta_buf:
                                item_delta_buf[item_id] += delta
                            seq = item_seq_map.get(item_id, seq_counter)
                            await result_queue.put({
                                "seq": seq,
                                "final": False,
                                "text": item_delta_buf.get(item_id, delta),
                                "start_at": 0,
                                "duration": 0,
                            })

                        elif event_type == "conversation.item.input_audio_transcription.completed":
                            item_id = event.get("item_id", "")
                            transcript = event.get("transcript", "")
                            seq = item_seq_map.get(item_id, seq_counter)
                            await result_queue.put({
                                "seq": seq,
                                "final": True,
                                "text": transcript,
                                "start_at": 0,
                                "duration": 0,
                            })
                            item_delta_buf.pop(item_id, None)

                            # 오디오 전송 완료 + pending 아이템 없음 → 종료
                            if send_done.is_set() and not item_delta_buf:
                                await ws.close()
                                return

                        elif event_type == "error":
                            error_msg = event.get("error", {}).get("message", "Unknown error")
                            print(f"OpenAI Realtime 오류: {error_msg}")

                except websockets.exceptions.ConnectionClosed:
                    pass
                finally:
                    await result_queue.put(None)

            send_task = asyncio.create_task(send_audio())
            recv_task = asyncio.create_task(receive_results())

            try:
                while True:
                    result = await result_queue.get()
                    if result is None:
                        break
                    yield result
            except asyncio.CancelledError:
                pass  # 서버 종료(Ctrl+C) 시 result_queue 대기 취소 에러 무시
            finally:
                send_task.cancel()
                recv_task.cancel()
                try:
                    await send_task
                except asyncio.CancelledError:
                    pass
                try:
                    await recv_task
                except asyncio.CancelledError:
                    pass
