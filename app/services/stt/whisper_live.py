"""WhisperLive 로컬 STT 프로바이더"""

import asyncio
import json
import struct
from typing import AsyncGenerator, Dict, Any, Optional

import websockets

from app.services.stt.base import STTProvider

# Whisper 모델이 기대하는 샘플레이트
WHISPER_SAMPLE_RATE = 16000


def _resample_pcm_int16(data: bytes, src_rate: int, dst_rate: int) -> bytes:
    """PCM Int16 바이트를 리샘플링 (선형 보간)"""
    if src_rate == dst_rate:
        return data

    src_samples = struct.unpack(f"<{len(data) // 2}h", data)
    src_len = len(src_samples)
    ratio = src_rate / dst_rate
    dst_len = int(src_len / ratio)

    dst_samples = []
    for i in range(dst_len):
        src_idx = i * ratio
        idx = int(src_idx)
        frac = src_idx - idx
        if idx + 1 < src_len:
            sample = src_samples[idx] * (1 - frac) + src_samples[idx + 1] * frac
        else:
            sample = src_samples[idx]
        dst_samples.append(int(sample))

    return struct.pack(f"<{len(dst_samples)}h", *dst_samples)


def _parse_timestamp(value: Any) -> float:
    """시간 값을 초(float)로 변환. '0:01:23' 문자열 또는 숫자 모두 처리"""
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        parts = value.split(":")
        if len(parts) == 3:
            h, m, s = parts
            return int(h) * 3600 + int(m) * 60 + float(s)
        if len(parts) == 2:
            m, s = parts
            return int(m) * 60 + float(s)
    return 0.0


class WhisperLiveProvider(STTProvider):
    """WhisperLive 로컬 서버 STT 프로바이더

    WhisperLive 프로토콜:
      - 연결 직후 서버가 config JSON을 먼저 보냄
      - 클라이언트는 바이트만 전송 (JSON 전송 시 에러)
      - 서버 응답은 누적 방식: {"lines": [...], "buffer_transcription": "..."}
      - 처리 완료 시 {"type": "ready_to_stop"} 수신
    """

    def __init__(self, server_url: str, recv_timeout: int = 15):
        self.server_url = server_url
        self.recv_timeout = recv_timeout

    async def stream_transcribe(
        self,
        audio_stream: AsyncGenerator[bytes, None],
        sample_rate: int = 24000,
        encoding: str = "LINEAR16",
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """WhisperLive 서버를 사용한 스트리밍 STT

        누적 응답(lines 배열)을 증분 결과(seq/final/text)로 변환하여 yield.
        """
        async with websockets.connect(
            self.server_url,
            ping_interval=None,
            max_size=None,
        ) as ws:
            # 서버 config 수신 (WhisperLive는 연결 직후 서버가 먼저 보냄)
            init_msg = await asyncio.wait_for(ws.recv(), timeout=10)
            config = json.loads(init_msg)
            print(f"WhisperLive 서버 설정: {config}")

            # 내부 상태
            seq_counter = 0
            result_queue: asyncio.Queue[Optional[Dict[str, Any]]] = asyncio.Queue()
            send_done = asyncio.Event()

            async def send_audio() -> None:
                """오디오 청크를 16kHz로 리샘플링 후 바이트 전송 (JSON 전송 금지)"""
                try:
                    async for chunk in audio_stream:
                        resampled = _resample_pcm_int16(chunk, sample_rate, WHISPER_SAMPLE_RATE)
                        await ws.send(resampled)
                except websockets.exceptions.ConnectionClosed:
                    pass
                except Exception as e:
                    print(f"WhisperLive 오디오 전송 오류: {e}")
                finally:
                    send_done.set()

            async def receive_results() -> None:
                """누적 응답을 증분 결과로 변환하여 queue에 전달"""
                nonlocal seq_counter
                prev_finalized_count = 0
                prev_last_text = ""

                try:
                    while True:
                        timeout = 60 if not send_done.is_set() else self.recv_timeout
                        msg = await asyncio.wait_for(ws.recv(), timeout=timeout)
                        data = json.loads(msg)

                        if not isinstance(data, dict):
                            continue

                        if data.get("type") == "ready_to_stop":
                            break

                        lines = data.get("lines", [])
                        if not lines:
                            continue

                        # 새로 확정된 lines → final=True
                        # 마지막 line은 아직 변경될 수 있으므로 제외
                        finalize_up_to = len(lines) - 1
                        for i in range(prev_finalized_count, finalize_up_to):
                            text = lines[i].get("text", "").strip()
                            if text:
                                seq_counter += 1
                                await result_queue.put({
                                    "seq": seq_counter,
                                    "final": True,
                                    "text": text,
                                    "start_at": int(_parse_timestamp(lines[i].get("start", 0)) * 1000),
                                    "duration": int(
                                        (_parse_timestamp(lines[i].get("end", 0)) - _parse_timestamp(lines[i].get("start", 0))) * 1000
                                    ),
                                })
                        prev_finalized_count = max(prev_finalized_count, finalize_up_to)

                        # 마지막 line → final=False (진행 중, 실시간 표시)
                        last_text = lines[-1].get("text", "").strip()
                        if last_text and last_text != prev_last_text:
                            prev_last_text = last_text
                            await result_queue.put({
                                "seq": seq_counter + 1,
                                "final": False,
                                "text": last_text,
                                "start_at": int(_parse_timestamp(lines[-1].get("start", 0)) * 1000),
                                "duration": 0,
                            })

                except asyncio.TimeoutError:
                    pass
                except websockets.exceptions.ConnectionClosed:
                    pass

                # 종료 시 마지막 미확정 line을 final로 flush
                if prev_last_text:
                    seq_counter += 1
                    await result_queue.put({
                        "seq": seq_counter,
                        "final": True,
                        "text": prev_last_text,
                        "start_at": 0,
                        "duration": 0,
                    })

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
                pass
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
