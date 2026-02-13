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
│   │   ├── notion.py              # Notion API 라우터
│   │   ├── recordings.py          # Recordings API 라우터
│   │   └── streaming.py           # ✅ NEW: 실시간 STT WebSocket 라우터 (/ws/stt)
│   ├── services/
│   │   ├── rtzr_client.py         # Return Zero STT 클라이언트 (stream_transcribe 재사용)
│   │   ├── llm_summarizer.py      # LLM 요약 서비스
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
│   │   ├── page.tsx               # 메인 페이지 (녹음 UI) — 아직 스트리밍 미통합
│   │   ├── settings/page.tsx      # 설정 (Notion 연동)
│   │   └── recordings/page.tsx    # 녹음 기록
│   ├── hooks/
│   │   ├── use-streaming-stt.ts   # ✅ NEW: 실시간 STT 커스텀 훅
│   │   ├── use-mobile.tsx         # 모바일 감지
│   │   └── use-toast.ts           # 토스트
│   ├── lib/
│   │   ├── api.ts                 # API 레이어 (WS_BASE_URL 추가 완료)
│   │   └── validations.ts         # Zod 입력 검증
│   ├── public/
│   │   └── audio-worklet-processor.js  # ✅ NEW: AudioWorklet (Float32→Int16 PCM)
│   ├── types/index.ts             # 전역 타입 정의
│   └── components/                # UI 컴포넌트
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

### Frontend (2026-02-05 ~ 07)
- [x] 녹음 UI (MediaRecorder, Ogg Opus 우선)
- [x] 설정 페이지 (Notion 연동)
- [x] 상태 폴링 (2초 간격)
- [x] Zod 검증, 타입 정의, API 레이어

### 오디오 최적화 (2026-02-07)
- [x] WebM → Ogg Opus 변환 (ffmpeg -c:a copy, 재인코딩 없음)
- [x] 브라우저에서 Ogg Opus 직접 녹음 시도

### Notion URL 입력 방식 변경 (2026-02-10)
- [x] Database ID 직접 입력 → Notion 페이지 URL 붙여넣기 방식으로 변경
- [x] Backend/Frontend 전체 변경 완료

### Notion 자동 저장 + 테스트 + 버그 수정 (2026-02-10)
- [x] STT → AI 요약 → Notion 저장 파이프라인 완성
- [x] pytest 테스트 환경 구축 (conftest, 단위, 통합, 실제 API)
- [x] Notion 자동 저장 버그 수정 (useCallback 의존성 배열 누락)

### 실시간 스트리밍 STT 구현 (2026-02-12) — 진행 중
- [x] Return Zero 스트리밍 WebSocket API 문서 분석
- [x] 구현 계획 수립 (`.claude/plans/dazzling-puzzling-conway.md`)
- [x] **Step 1**: `app/api/routes/streaming.py` — WebSocket 릴레이 엔드포인트
- [x] **Step 1**: `app/main.py` — streaming 라우터 등록
- [x] **Step 2**: `frontend/public/audio-worklet-processor.js` — PCM 캡처
- [x] **Step 3**: `frontend/hooks/use-streaming-stt.ts` — 스트리밍 훅
- [x] **Step 6**: `frontend/lib/api.ts` — `WS_BASE_URL` 추가
- [ ] **Step 4**: `frontend/components/live-transcript.tsx` — 실시간 전사 UI
- [ ] **Step 4**: `frontend/components/mode-selector.tsx` — 모드 전환 토글
- [ ] **Step 5**: `frontend/app/page.tsx` — 스트리밍 모드 통합

## 다음에 해야 할 작업

### 남은 작업 (Step 4~5)

#### Step 4: UI 컴포넌트 생성
- [ ] `frontend/components/live-transcript.tsx`
  - props: `segments`, `interimText`, `isStreaming`
  - 확정 텍스트 + 진행 중 텍스트(이탤릭) 표시, 자동 스크롤
- [ ] `frontend/components/mode-selector.tsx`
  - props: `mode` (`"realtime" | "upload"`), `onModeChange`, `disabled`
  - Mic / Upload 아이콘 토글 버튼

#### Step 5: page.tsx 통합
- [ ] `frontend/app/page.tsx` 수정
  - `recordingMode` state 추가 (`"realtime" | "upload"`)
  - `useStreamingSTT()` 훅 사용
  - idle: `<ModeSelector>` 표시
  - `handleRecordToggle` 분기: realtime → startStreaming/stopStreaming, upload → 기존 플로우
  - recording + realtime: `<LiveTranscript>` 표시
  - 모드 셀렉터는 녹음/처리 중 disabled

#### 이후 작업
- [ ] E2E 테스트: 실시간 녹음 → 텍스트 표시 확인
- [ ] 파일 업로드 회귀 테스트
- [ ] LLM 요약 실시간화 (다음 세션)

### 아키텍처
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
- **기본 모드**: 실시간 STT, 파일 업로드는 UI 옵션

### EOS 전파 흐름
```
Stop 클릭 → AudioWorklet disconnect → 마이크 정리
→ {"type":"eos"} 전송 → Backend Queue에 None
→ stream_transcribe()가 "EOS" 전송 → Return Zero 잔여 처리
→ 최종 결과 릴레이 → {"type":"eos_ack"} → Frontend idle
```

### 참고 파일
- `temp.py` — Return Zero 스트리밍 STT 참고 코드 (LINEAR16, 8kHz)
- `.claude/plans/dazzling-puzzling-conway.md` — 상세 구현 계획 (코드 스니펫 포함)

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

### Streaming (엔드포인트 생성 완료, 프론트엔드 통합 미완)
```
WS     /ws/stt                      - 실시간 스트리밍 STT WebSocket
```

## 테스트 실행 방법
```bash
# 단위 테스트 (외부 API 모킹)
pytest tests/test_notion_unit.py -v

# API 통합 테스트 (외부 API 모킹)
pytest tests/test_api.py -v

# Notion 실제 API 테스트 (.env 필요)
pytest tests/test_notion.py -v -s

# 전체 pytest 테스트
pytest tests/test_notion_unit.py tests/test_api.py tests/test_notion.py -v
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
- **날짜**: 2026-02-12
- **브랜치**: main
- **마지막 커밋**: `92503ec` Feat:stt-llm-notion 파이프라인 구축
- **변경된 파일 (unstaged)**: .gitignore, Project.md, app/main.py
- **새 파일 (untracked)**: HANDOFF.md, temp.py, app/api/routes/streaming.py, frontend/hooks/use-streaming-stt.ts, frontend/public/audio-worklet-processor.js, frontend/lib/api.ts
- **진행 상태**: Step 1~3, 6 완료 / Step 4~5 남음

## 새 세션 시작
```
"HANDOFF.md 읽고 실시간 스트리밍 STT 이어서 구현해줘 (Step 4~5 남음)"
```
