"""
실시간 스트리밍 STT WebSocket 라우터

Protocol:
  Client -> Server:
    - binary: 오디오 청크 (Int16 PCM)
    - JSON {"type": "config", "sample_rate": 24000}: 초기 설정 (선택, 첫 메시지)
    - JSON {"type": "eos"}: 스트림 종료 신호

  Server -> Client:
    - JSON {"type": "stt_result", "seq": N, "final": bool, "text": "..."}
    - JSON {"type": "error", "message": "..."}
    - JSON {"type": "eos_ack"}: 모든 결과 전송 완료
"""

import asyncio
import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.stt import get_stt_provider

router = APIRouter()


@router.websocket("/ws/stt")
async def streaming_stt(websocket: WebSocket) -> None:
    """실시간 스트리밍 STT WebSocket 엔드포인트"""
    await websocket.accept()

    sample_rate = 24000
    encoding = "LINEAR16"

    audio_queue: asyncio.Queue[Optional[bytes]] = asyncio.Queue()
    stt_provider = get_stt_provider()

    async def audio_generator():
        """Queue에서 오디오 청크를 꺼내어 yield하는 비동기 제너레이터"""
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                return
            yield chunk

    async def relay_results():
        """STT 프로바이더 결과를 브라우저로 중계"""
        try:
            async for result in stt_provider.stream_transcribe(
                audio_stream=audio_generator(),
                sample_rate=sample_rate,
                encoding=encoding,
            ):
                await websocket.send_json({
                    "type": "stt_result",
                    "seq": result["seq"],
                    "final": result["final"],
                    "text": result["text"],
                    "start_at": result.get("start_at", 0),
                    "duration": result.get("duration", 0),
                })

            await websocket.send_json({"type": "eos_ack"})
        except WebSocketDisconnect:
            pass
        except Exception as e:
            try:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e),
                })
            except Exception:
                pass

    relay_task = asyncio.create_task(relay_results())

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                await audio_queue.put(message["bytes"])
            elif "text" in message:
                data = json.loads(message["text"])
                msg_type = data.get("type", "")

                if msg_type == "config":
                    sample_rate = data.get("sample_rate", 24000)
                    encoding = data.get("encoding", "LINEAR16")
                elif msg_type == "eos":
                    await audio_queue.put(None)
                    break

    except WebSocketDisconnect:
        await audio_queue.put(None)
    except Exception:
        await audio_queue.put(None)
    finally:
        await relay_task
