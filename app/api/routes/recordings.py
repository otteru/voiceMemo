"""
Recordings API 라우터
"""

import uuid
import subprocess
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.recording import Recording
from app.schemas.recording import (
    RecordingCreateResponse,
    RecordingResponse,
    RecordingStatusResponse,
)
from app.services.llm_summarizer import LectureSummarizer
from app.services.rtzr_client import RTZRClient

router = APIRouter()


async def process_recording(recording_id: str, audio_path: str) -> None:
    """
    백그라운드에서 녹음 파일 처리 (STT → AI 요약)

    Args:
        recording_id: 녹음 ID
        audio_path: 오디오 파일 경로
    """
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            recording = await db.get(Recording, recording_id)
            if not recording:
                return

            # 1단계: 오디오 파일 형식 확인 및 변환
            recording.status = "stt"
            recording.progress = 10
            await db.commit()

            audio_path_obj = Path(audio_path)
            
            # 파일 확장자 확인
            file_ext = audio_path_obj.suffix.lower()
            
            # 이미 Ogg 형식이면 변환 스킵
            if file_ext in ['.ogg', '.opus']:
                opus_path = audio_path_obj
                print(f"✅ Ogg 파일 감지, 변환 스킵: {opus_path}")
            else:
                # WebM → Ogg Opus 변환 (코덱 복사)
                opus_path = audio_path_obj.with_suffix(".opus.ogg")
                
                try:
                    subprocess.run(
                        [
                            "ffmpeg",
                            "-i", str(audio_path),  # 입력 (WebM/Opus)
                            "-c:a", "copy",  # 오디오 코덱 복사 (재인코딩 안 함)
                            "-y",  # 덮어쓰기
                            str(opus_path),  # 출력 (Ogg/Opus)
                        ],
                        check=True,
                        capture_output=True,
                        stderr=subprocess.DEVNULL,  # ffmpeg 로그 숨김
                    )
                    print(f"✅ WebM → Ogg 변환 완료: {opus_path}")
                except subprocess.CalledProcessError as e:
                    print(f"❌ ffmpeg 변환 실패: {e.stderr.decode()}")
                    raise e

            # 2단계: STT
            recording.progress = 20
            await db.commit()

            stt_client = RTZRClient(
                client_id=settings.return_zero_client_id,
                client_secret=settings.return_zero_client_secret,
            )
            results = await stt_client.transcribe_file(
                audio_file_path=str(opus_path),  # 변환된 Opus 파일 사용
                chunk_size=8192,
                sample_rate=48000,  # Opus는 보통 48kHz
                encoding="OGG_OPUS",
            )

            # STT 결과 텍스트 추출
            stt_text = " ".join(
                r.get("alternatives", [{}])[0].get("text", "")
                for r in results
                if r.get("final")
            )
            recording.stt_text = stt_text
            recording.progress = 50
            await db.commit()

            # 변환된 파일 정리 (원본 파일과 다른 경우만)
            if opus_path != audio_path_obj and opus_path.exists():
                opus_path.unlink()
                print(f"🗑️ 변환 파일 삭제: {opus_path}")

            # 3단계: AI 요약
            recording.status = "ai"
            recording.progress = 60
            await db.commit()

            summarizer = LectureSummarizer()
            summary = await summarizer.summarize_async(stt_text)

            recording.summary = summary
            recording.status = "complete"
            recording.progress = 100
            await db.commit()

        except Exception as e:
            recording = await db.get(Recording, recording_id)
            if recording:
                recording.status = "idle"
                recording.progress = 0
                await db.commit()
            raise e


@router.post("", response_model=RecordingCreateResponse)
async def create_recording(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    audio: UploadFile = File(...),
    title: str = Form(default=""),
) -> RecordingCreateResponse:
    """오디오 파일 업로드 및 처리 시작"""
    # 파일 저장
    recording_id = str(uuid.uuid4())
    audio_dir = Path(settings.output_dir) / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    # Content-Type 기반 확장자 결정
    content_type = audio.content_type or ""
    if "ogg" in content_type or "opus" in content_type:
        file_ext = ".ogg"
    elif "webm" in content_type:
        file_ext = ".webm"
    elif audio.filename:
        file_ext = Path(audio.filename).suffix or ".webm"
    else:
        file_ext = ".webm"
    
    audio_path = audio_dir / f"{recording_id}{file_ext}"
    print(f"📥 파일 업로드: {audio.content_type} → {file_ext}")

    content = await audio.read()
    audio_path.write_bytes(content)

    # DB 레코드 생성
    recording_title = title or audio.filename or "녹음"
    recording = Recording(
        id=recording_id,
        title=recording_title,
        audio_file_path=str(audio_path),
        status="idle",
        progress=0,
    )
    db.add(recording)
    await db.commit()

    # 백그라운드 처리 시작
    background_tasks.add_task(process_recording, recording_id, str(audio_path))

    return RecordingCreateResponse(
        id=recording_id,
        status="stt",
        message="처리를 시작합니다",
    )


@router.get("", response_model=list[RecordingResponse])
async def list_recordings(
    db: AsyncSession = Depends(get_db),
) -> list[RecordingResponse]:
    """녹음 목록 조회"""
    result = await db.execute(
        select(Recording).order_by(Recording.created_at.desc())
    )
    recordings = result.scalars().all()
    return [RecordingResponse.model_validate(r) for r in recordings]


@router.get("/{recording_id}", response_model=RecordingResponse)
async def get_recording(
    recording_id: str,
    db: AsyncSession = Depends(get_db),
) -> RecordingResponse:
    """녹음 상세 조회"""
    recording = await db.get(Recording, recording_id)
    if not recording:
        raise HTTPException(status_code=404, detail="녹음을 찾을 수 없습니다")
    return RecordingResponse.model_validate(recording)


@router.get("/{recording_id}/status", response_model=RecordingStatusResponse)
async def get_recording_status(
    recording_id: str,
    db: AsyncSession = Depends(get_db),
) -> RecordingStatusResponse:
    """녹음 처리 상태 조회 (폴링용)"""
    recording = await db.get(Recording, recording_id)
    if not recording:
        raise HTTPException(status_code=404, detail="녹음을 찾을 수 없습니다")
    return RecordingStatusResponse(status=recording.status, progress=recording.progress)


@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """녹음 삭제"""
    recording = await db.get(Recording, recording_id)
    if not recording:
        raise HTTPException(status_code=404, detail="녹음을 찾을 수 없습니다")

    # 오디오 파일 삭제
    if recording.audio_file_path:
        audio_path = Path(recording.audio_file_path)
        if audio_path.exists():
            audio_path.unlink()

    await db.delete(recording)
    await db.commit()
    return {"message": "삭제되었습니다"}
