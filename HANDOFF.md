# 작업 인계 문서

## 프로젝트 개요
**Voice Memo** - 강의 녹음 자동 정리 앱
- 대학생들이 웹사이트에서 강의를 녹음 → STT 변환 → AI 정리 → 노션 저장

## 프로젝트 구조
```
voiceMemo/
├── app/
│   ├── main.py                    # FastAPI 앱 (CORS, 세션, lifespan, 스트리밍 라우터 등록 완료)
│   ├── api/routes/
│   │   ├── notion.py              # Notion API 라우터 (POST /api/notion/save)
│   │   ├── recordings.py          # Recordings API 라우터 (업로드→STT→LLM 파이프라인)
│   │   └── streaming.py           # 실시간 STT WebSocket 라우터 (/ws/stt)
│   ├── services/
│   │   ├── rtzr_client.py         # Return Zero STT 클라이언트 (stream_transcribe 재사용)
│   │   ├── llm_summarizer.py      # LLM 요약 서비스 (summarize_async)
│   │   └── notion_client.py       # Notion API 클라이언트
│   ├── schemas/
│   │   ├── notion.py              # Notion Pydantic 스키마
│   │   └── recording.py           # Recording Pydantic 스키마
│   ├── models/
│   │   └── recording.py           # Recording DB 모델
│   └── core/
│       ├── config.py              # 환경변수 설정
│       ├── security.py            # 세션 관리 (httpOnly 쿠키)
│       └── database.py            # SQLAlchemy 비동기 ORM
├── tests/
│   ├── conftest.py                # pytest 픽스처
│   ├── test_api.py                # API 엔드포인트 통합 테스트 (모킹)
│   ├── test_notion_unit.py        # NotionService 단위 테스트 (모킹)
│   ├── test_notion.py             # Notion 실제 API 연동 테스트 (.env 사용)
│   ├── test_stt.py                # STT 수동 테스트 (스크립트)
│   └── test_llm_summary.py        # LLM 수동 테스트 (스크립트)
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # 메인 페이지 (실시간+업로드 모드 통합 완료)
│   │   ├── settings/page.tsx      # 설정 (Notion 연동)
│   │   └── recordings/page.tsx    # 녹음 기록
│   ├── hooks/
│   │   ├── use-streaming-stt.ts   # 실시간 STT 커스텀 훅 (finalText 반환)
│   │   ├── use-mobile.tsx         # 모바일 감지
│   │   └── use-toast.ts           # 토스트
│   ├── lib/
│   │   ├── api.ts                 # API 레이어 (WS_BASE_URL 포함)
│   │   └── validations.ts         # Zod 입력 검증
│   ├── public/
│   │   └── audio-worklet-processor.js  # AudioWorklet (Float32→Int16 PCM)
│   ├── types/index.ts             # 전역 타입 정의
│   └── components/
│       ├── live-transcript.tsx     # 실시간 전사 UI (자동 스크롤)
│       ├── mode-selector.tsx       # 실시간/업로드 모드 토글
│       ├── record-button.tsx       # 녹음 버튼
│       ├── audio-waveform.tsx      # 오디오 파형
│       ├── processing-status.tsx   # 처리 진행 상태
│       ├── summary-preview.tsx     # 요약 미리보기
│       ├── feature-card.tsx        # 기능 카드
│       └── header.tsx              # 헤더
├── temp.py                        # Return Zero 스트리밍 STT 참고 코드
├── pyproject.toml                 # pytest 설정 (pythonpath)
├── requirements.txt               # Python 의존성
├── CLAUDE.md                      # 프로젝트 개요
└── HANDOFF.md                     # 이 파일
```

## 완료된 작업

### 인프라 (2026-02-07)
- [x] FastAPI 앱 구조 (main.py, CORS, 세션 미들웨어, lifespan)
- [x] SQLAlchemy 비동기 ORM (SQLite)
- [x] httpOnly 쿠키 세션 관리

### Backend API (2026-02-07)
- [x] Recordings API (CRUD + 백그라운드 처리)
- [x] Notion API (config, status, disconnect, save)
- [x] Return Zero 스트리밍 STT (OGG_OPUS)
- [x] LangChain + OpenRouter LLM 요약

### Frontend 기본 (2026-02-05 ~ 07)
- [x] 녹음 UI (MediaRecorder, Ogg Opus 우선)
- [x] 설정 페이지 (Notion 연동)
- [x] 상태 폴링 (2초 간격)
- [x] Zod 검증, 타입 정의, API 레이어

### Notion URL 입력 방식 변경 (2026-02-10)
- [x] Database ID 직접 입력 → Notion 페이지 URL 붙여넣기 방식으로 변경

### Notion 자동 저장 + 테스트 + 버그 수정 (2026-02-10)
- [x] STT → AI 요약 → Notion 저장 파이프라인 완성 (업로드 모드)
- [x] pytest 테스트 환경 구축

### 실시간 스트리밍 STT (2026-02-12 ~ 13)
- [x] Step 1: `streaming.py` WebSocket 릴레이 엔드포인트 + `main.py` 등록
- [x] Step 2: `audio-worklet-processor.js` PCM 캡처
- [x] Step 3: `use-streaming-stt.ts` 스트리밍 훅
- [x] Step 4: `live-transcript.tsx` 실시간 전사 UI + `mode-selector.tsx` 모드 토글
- [x] Step 5: `page.tsx` 스트리밍 모드 통합 (모드 전환, LiveTranscript 표시)
- [x] Step 6: `api.ts` WS_BASE_URL 추가
- [x] 빌드 성공 확인

## 다음에 해야 할 작업

### 실시간 STT → LLM 요약 → Notion 파이프라인 연결 (핵심 이슈)

**현재 문제**: 실시간 STT가 끝나면 텍스트가 프론트엔드에만 있고, LLM 요약 및 Notion 저장으로 이어지지 않음.

**현재 흐름**:
```
[업로드 모드] 녹음 → 파일 업로드 → Backend STT → LLM 요약 → Notion 저장 ✅
[실시간 모드] 녹음 → WebSocket STT → 텍스트 표시 → 끝 ❌ (LLM/Notion 미연결)
```

**필요한 흐름**:
```
[실시간 모드] 녹음 → WebSocket STT → 텍스트 표시 → 종료 시 finalText → LLM 요약 → Notion 저장
```

**구현 방향 (2가지 옵션)**:

#### 옵션 A: 백엔드에 "텍스트 → LLM 요약" 새 엔드포인트 추가 (권장)
- `POST /api/recordings/summarize` — `stt_text`를 직접 받아서 LLM 요약 + DB 저장
- 프론트에서 스트리밍 종료 후 `finalText`를 이 엔드포인트로 전송
- 이후 기존 Notion 저장 플로우(`/api/notion/save`) 재사용

#### 옵션 B: 기존 recordings API 확장
- `POST /api/recordings`에 `stt_text` 필드 추가 (오디오 파일 없이 텍스트만 전송 가능)
- STT 단계 스킵하고 LLM → Notion 진행

**관련 파일**:
| 파일 | 역할 | 수정 필요 |
|------|------|----------|
| `app/api/routes/recordings.py` | 업로드→STT→LLM 파이프라인 | 새 엔드포인트 or 기존 확장 |
| `app/services/llm_summarizer.py` | `summarize_async(text)` | 수정 불필요 (이미 구현) |
| `frontend/app/page.tsx:223-226` | 실시간 종료 핸들러 | `finalText` → 백엔드 전송 로직 추가 |
| `frontend/lib/api.ts` | API 레이어 | 새 API 호출 함수 추가 |
| `frontend/hooks/use-streaming-stt.ts` | `finalText` 반환 | 수정 불필요 |

**page.tsx 핵심 코드 (현재 — line 223-226)**:
```ts
// stopStreaming만 호출하고 끝. finalText를 백엔드에 보내는 로직 없음.
if (recordingMode === "realtime") {
  stopStreaming()
  toast.info("스트리밍을 종료합니다...")
}
```

### 이후 작업
- [ ] E2E 테스트: 실시간 녹음 → 텍스트 표시 → LLM 요약 → Notion 저장
- [ ] 파일 업로드 회귀 테스트
- [ ] 에러 핸들링 강화 (WebSocket 재연결 등)

## 아키텍처
```
Browser (AudioWorklet + WebSocket)
    ↕ WebSocket (ws://localhost:8000/ws/stt)
FastAPI (릴레이 엔드포인트)
    ↕ WebSocket (wss://openapi.vito.ai/v1/transcribe:streaming)
Return Zero STT API
```

### 핵심 기술 결정사항
- **오디오 포맷**: AudioWorklet + LINEAR16 (PCM)
- **샘플레이트**: 16000 Hz
- **기존 코드 재사용**: `rtzr_client.py`의 `stream_transcribe()` 수정 없이 사용
- **기본 모드**: 실시간 STT (`recordingMode` 기본값 `"realtime"`)

### EOS 전파 흐름
```
Stop 클릭 → AudioWorklet disconnect → 마이크 정리
→ {"type":"eos"} 전송 → Backend Queue에 None
→ stream_transcribe()가 "EOS" 전송 → Return Zero 잔여 처리
→ 최종 결과 릴레이 → {"type":"eos_ack"} → Frontend idle
```

## 주의사항

### 환경 의존성
- **ffmpeg 필수**: `brew install ffmpeg` (오디오 변환용)
- **Python 환경**: conda `fastapi`, Python 3.13
- **Node 환경**: Next.js 16, React 19

### 외부 API 제약
- **Return Zero**: 토큰 6시간 유효 (자동 재발급), 스트리밍은 LINEAR16 16kHz 사용
- **OpenRouter**: 무료 모델 `arcee-ai/trinity-large-preview:free`, rate limit 주의
- **Notion**: Integration 연결 필수, `ntn_`으로 시작하는 토큰, 블록 최대 100개/요청

### 보안
- `.env` 파일 절대 커밋 금지
- Notion 토큰은 httpOnly 쿠키 세션으로 관리

## API 엔드포인트

### Recordings
```
POST   /api/recordings              - 오디오 업로드 (multipart/form-data)
GET    /api/recordings              - 목록 조회
GET    /api/recordings/{id}         - 상세 조회
GET    /api/recordings/{id}/status  - 처리 상태 폴링
DELETE /api/recordings/{id}         - 삭제
```

### Notion
```
GET    /api/notion/status           - 연결 상태 확인
POST   /api/notion/config           - 설정 저장 (token + pageUrl)
POST   /api/notion/disconnect       - 연결 해제
POST   /api/notion/save             - 요약 → Notion 페이지 생성
```

### Streaming
```
WS     /ws/stt                      - 실시간 스트리밍 STT WebSocket
```

## 테스트 실행 방법
```bash
# 단위 테스트 (외부 API 모킹)
pytest tests/test_notion_unit.py -v

# API 통합 테스트 (외부 API 모킹)
pytest tests/test_api.py -v

# 전체 pytest 테스트
pytest tests/test_notion_unit.py tests/test_api.py -v
```

## 서버 실행 방법
```bash
# Backend (터미널 1)
conda activate fastapi
uvicorn app.main:app --reload --port 8000

# Frontend (터미널 2)
cd frontend
npm run dev
```
- Backend: http://localhost:8000 (Swagger: http://localhost:8000/docs)
- Frontend: http://localhost:3000

## 마지막 상태
- **날짜**: 2026-02-13
- **브랜치**: main
- **마지막 커밋**: `1de274e` Feat: 실시간 스트리밍 Websoket 기반 구현 백엔드 및 프론트 훅 구현
- **변경된 파일 (unstaged)**: Project.md, frontend/app/page.tsx
- **새 파일 (untracked)**: frontend/components/live-transcript.tsx, frontend/components/mode-selector.tsx
- **빌드 상태**: 성공 (Next.js 빌드 통과)
- **진행 상태**: 실시간 STT UI 완료 / LLM+Notion 연결 미구현

## 새 세션 시작
```
"HANDOFF.md 읽고 실시간 STT → LLM 요약 → Notion 저장 파이프라인 연결해줘"
```
