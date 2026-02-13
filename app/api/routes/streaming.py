"""
실시간 스트리밍 STT WebSocket 라우터

Protocol:
  Client → Server:
    - binary: 오디오 청크 (Int16 PCM)
    - JSON {"type": "config", "sample_rate": 16000}: 초기 설정 (선택, 첫 메시지)
    - JSON {"type": "eos"}: 스트림 종료 신호

  Server → Client:
    - JSON {"type": "stt_result", "seq": N, "final": bool, "text": "..."}
    - JSON {"type": "error", "message": "..."}
    - JSON {"type": "eos_ack"}: 모든 결과 전송 완료
"""

import asyncio
import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.services.rtzr_client import RTZRClient

router = APIRouter()


@router.websocket("/ws/stt")
async def streaming_stt(websocket: WebSocket) -> None:
    """실시간 스트리밍 STT WebSocket 엔드포인트"""
    await websocket.accept()

    # 기본 설정
    sample_rate = 16000
    encoding = "LINEAR16"

    # 오디오 청크를 전달할 큐 (None = EOS)
    audio_queue: asyncio.Queue[Optional[bytes]] = asyncio.Queue()

    rtzr_client = RTZRClient(
        client_id=settings.return_zero_client_id,
        client_secret=settings.return_zero_client_secret,
    )

    async def audio_generator():
        """Queue에서 오디오 청크를 꺼내어 yield하는 비동기 제너레이터"""
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                return
            yield chunk

    async def relay_results():
        """Return Zero 결과를 브라우저로 중계"""
        try:
            async for result in rtzr_client.stream_transcribe(
                audio_stream=audio_generator(),
                sample_rate=sample_rate,
                encoding=encoding,
                use_itn=True,
                use_disfluency_filter=True,
            ):
                alternatives = result.get("alternatives", [])
                text = alternatives[0].get("text", "") if alternatives else ""

                await websocket.send_json({
                    "type": "stt_result",
                    "seq": result.get("seq", 0),
                    "final": result.get("final", False),
                    "text": text,
                    "start_at": result.get("start_at", 0),
                    "duration": result.get("duration", 0),
                })

            # 모든 결과 전송 완료
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

    # Return Zero 결과 중계 태스크 시작
    relay_task = asyncio.create_task(relay_results())

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                # 바이너리 오디오 청크
                await audio_queue.put(message["bytes"])
            elif "text" in message:
                data = json.loads(message["text"])
                msg_type = data.get("type", "")

                if msg_type == "config":
                    # 초기 설정 (오디오 전송 전에 보내야 함)
                    sample_rate = data.get("sample_rate", 16000)
                    encoding = data.get("encoding", "LINEAR16")
                elif msg_type == "eos":
                    # 스트림 종료
                    await audio_queue.put(None)
                    break

    except WebSocketDisconnect:
        await audio_queue.put(None)
    except Exception:
        await audio_queue.put(None)
    finally:
        # relay_task 완료 대기 (Return Zero 잔여 결과 수신)
        await relay_task
