# 작업 인계 문서

## 프로젝트 개요
**Voice Memo** - 강의 녹음 자동 정리 앱
- 대학생들이 웹사이트에서 강의를 녹음 → STT 변환 → AI 정리 → 노션 저장

## 프로젝트 구조
```
voiceMemo/
├── app/
│   ├── main.py                    # FastAPI 앱 (CORS, 세션, lifespan, 라우터 등록)
│   ├── api/routes/
│   │   ├── notion.py              # Notion API 라우터 (POST /api/notion/save)
│   │   ├── recordings.py          # Recordings API 라우터 (업로드 모드 STT 비활성화됨)
│   │   ├── streaming.py           # 실시간 STT WebSocket 라우터 (/ws/stt)
│   │   └── report.py              # 점진적 보고서 라우터 (POST /api/report/progressive)
│   ├── services/
│   │   ├── stt/                   # STT 프로바이더 추상화
│   │   │   ├── __init__.py        # 팩토리 (get_stt_provider, STT_PROVIDER 환경변수)
│   │   │   ├── base.py            # 공통 인터페이스 (STTProvider ABC)
│   │   │   ├── openai_realtime.py # OpenAI Realtime Transcription 프로바이더
│   │   │   └── return_zero.py     # Return Zero STT 프로바이더
│   │   ├── llm_summarizer.py      # LLM 서비스 (summarize_async + generate_progressive_report_async)
│   │   └── notion_client.py       # Notion API 클라이언트
│   ├── schemas/
│   │   ├── notion.py              # Notion Pydantic 스키마
│   │   ├── recording.py           # Recording Pydantic 스키마
│   │   └── report.py              # 점진적 보고서 스키마 (ProgressiveReportRequest/Response)
│   ├── models/
│   │   └── recording.py           # Recording DB 모델
│   └── core/
│       ├── config.py              # 환경변수 설정 (stt_provider, openai_api_key 등)
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
│   │   ├── page.tsx               # 메인 페이지 (듀얼 패널 + 점진적 보고서 통합 완료)
│   │   ├── settings/page.tsx      # 설정 (Notion 연동)
│   │   └── recordings/page.tsx    # 녹음 기록
│   ├── hooks/
│   │   ├── use-streaming-stt.ts   # 실시간 STT 커스텀 훅 (24kHz PCM, finalText 반환)
│   │   ├── use-progressive-report.ts # 점진적 보고서 훅 (triggerReport, resetReport)
│   │   ├── use-mobile.tsx         # 모바일 감지
│   │   └── use-toast.ts           # 토스트
│   ├── lib/
│   │   ├── api.ts                 # API 레이어 (WS_BASE_URL, reportApi 포함)
│   │   └── validations.ts         # Zod 입력 검증
│   ├── public/
│   │   └── audio-worklet-processor.js  # AudioWorklet (Float32→Int16 PCM, 24kHz, 2400샘플 버퍼)
│   ├── types/index.ts             # 전역 타입 정의 (Report 타입 포함)
│   └── components/
│       ├── dual-panel.tsx         # 듀얼 패널 레이아웃 (좌: STT, 우: 보고서)
│       ├── report-panel.tsx       # AI 보고서 패널 (우측)
│       ├── live-transcript.tsx    # 실시간 전사 UI (자동 스크롤, className prop)
│       ├── mode-selector.tsx      # 실시간/업로드 모드 토글
│       ├── record-button.tsx      # 녹음 버튼
│       ├── audio-waveform.tsx     # 오디오 파형
│       ├── processing-status.tsx  # 처리 진행 상태
│       ├── summary-preview.tsx    # 요약 미리보기
│       ├── feature-card.tsx       # 기능 카드
│       └── header.tsx             # 헤더
├── docs/                          # 문서 (STT 모델 참고, 미래 계획 등)
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
- [x] WebSocket 릴레이 엔드포인트 + AudioWorklet PCM 캡처
- [x] use-streaming-stt.ts 스트리밍 훅
- [x] live-transcript.tsx 실시간 전사 UI + mode-selector.tsx 모드 토글
- [x] page.tsx 스트리밍 모드 통합

### 듀얼 패널 + 점진적 보고서 (2026-02-14)
- [x] 백엔드 보고서 엔드포인트 (`POST /api/report/progressive`)
- [x] 프론트엔드 API 레이어 + 타입
- [x] 점진적 보고서 훅 + 듀얼 패널 UI
- [x] page.tsx 전체 통합 (3분 타이머, pendingFinalRef, 최종 보고서 화면)

### STT 프로바이더 추상화 + OpenAI 전환 (2026-02-16)
- [x] STT 프로바이더 추상화 (base.py → factory → openai/return_zero)
- [x] OpenAI Realtime Transcription API 프로바이더 구현
- [x] 환경변수 `STT_PROVIDER`로 프로바이더 전환 지원 (기본값: `"openai"`)
- [x] 기본 sample rate 24000Hz로 전체 통일
- [x] AudioWorklet 버퍼 사이즈 2400 샘플 (24kHz * 0.1s)로 수정
- [x] WebSocket URL: `?intent=transcription` (모델은 session.update에서 지정)
- [x] session.update에 `"type": "transcription"` 필수 파라미터 추가
- [x] `websockets==12.0` 호환: `extra_headers` 사용 (v13+는 `additional_headers`)
- [x] 업로드 모드 STT 비활성화 (recordings.py에서 RTZRClient import 제거)
- [x] 빈 버퍼 commit 에러 핸들링 (server_vad 이미 커밋 시 무해한 에러)
- [x] HANDOFF.md 업데이트
- [x] E2E 테스트 완료

## 다음에 해야 할 작업

### 커밋 및 푸시
- [ ] 현재 변경사항 커밋 (STT 추상화 + OpenAI 전환 + 듀얼 패널)
- [ ] 브랜치 전략에 따라 feature 브랜치 생성 후 PR

### 개선 가능 항목
- [ ] 업로드 모드 복구 (OpenAI Whisper API 또는 Return Zero 사용)
- [ ] 보고서 생성 프롬프트 튜닝 (강의 특성에 맞게)
- [ ] 보고서 갱신 주기 조절 UI (현재 3분 고정)
- [ ] WebSocket 재연결 로직
- [ ] 모바일 UX 개선

## 아키텍처

### 실시간 모드 흐름 (완성)
```
녹음 시작 → STT 좌측 패널 실시간 표시
         → 3분마다 LLM 보고서 → 우측 패널에 갱신 표시
         → 녹음 종료 → eos_ack 대기 → 최종 보고서 화면
         → 사용자 선택: Notion 저장 / 복사 / 새 녹음
```

### STT 프로바이더 추상화
- `STT_PROVIDER` 환경변수로 전환 (`"openai"` | `"return_zero"`, 기본값: `"openai"`)
- 공통 인터페이스: `stream_transcribe(audio_stream, sample_rate, encoding)` → `{seq, final, text, start_at, duration}`
- OpenAI: Realtime Transcription API (server_vad, gpt-4o-mini-transcribe)
  - WebSocket URL: `wss://api.openai.com/v1/realtime?intent=transcription`
  - session.update에 `"type": "transcription"` 필수
  - server_vad가 침묵 감지 시 자동 커밋 → committed → delta → completed 이벤트 순서
- Return Zero: VITO 스트리밍 STT (JWT 토큰 자동 재발급)

### OpenAI Realtime 이벤트 흐름
```
클라이언트: input_audio_buffer.append (오디오 계속 전송)
서버(VAD): input_audio_buffer.committed (발화 끝 감지 → 자동 커밋)
서버: conversation.item.input_audio_transcription.delta (실시간 부분 텍스트)
서버: conversation.item.input_audio_transcription.completed (최종 확정 텍스트)
```

### EOS 전파 흐름
```
Stop 클릭 → AudioWorklet disconnect → 마이크 정리
→ {"type":"eos"} 전송 → Backend Queue에 None
→ stream_transcribe() 종료 → STT 프로바이더 잔여 처리
→ 최종 결과 릴레이 → {"type":"eos_ack"} → Frontend idle
→ pendingFinalRef 감지 → 최종 보고서 화면 표시
```

### 핵심 기술 결정사항
- **오디오 포맷**: AudioWorklet + LINEAR16 (PCM), 24000 Hz
- **STT**: OpenAI Realtime Transcription API (기본), Return Zero (전환 가능)
- **보고서 용어**: "요약"이 아닌 "보고서/정리본" (시험 준비용 상세 내용 보존)
- **보고서 형식**: 하이브리드 (핵심 키워드 + 주요 내용 + 중요 포인트)
- **최종 출력**: 마지막 점진적 보고서를 그대로 사용 (별도 final LLM 호출 없음)
- **저장 방식**: DB 저장 없이 사용자가 Notion 저장 또는 클립보드 복사 선택
- **업로드 모드**: STT 비활성화 상태 (UI는 남아있으나 실제 전사 안 됨)

## 주의사항

### 환경 의존성
- **ffmpeg 필수**: `brew install ffmpeg` (오디오 변환용)
- **Python 환경**: conda `fastapi`, Python 3.13
- **Node 환경**: Next.js 16, React 19

### 외부 API 제약
- **OpenAI**: Realtime Transcription API, 24kHz PCM, server_vad 모드
- **Return Zero**: 토큰 6시간 유효 (자동 재발급), 스트리밍은 LINEAR16 24kHz 사용
- **OpenRouter**: 무료 모델 `arcee-ai/trinity-large-preview:free`, rate limit 주의
- **Notion**: Integration 연결 필수, `ntn_`으로 시작하는 토큰, 블록 최대 100개/요청

### websockets 버전 주의
- `websockets==12.0` 사용 중 → `extra_headers` 파라미터
- v13+ 업그레이드 시 `additional_headers`로 변경 필요

### 보안
- `.env` 파일 절대 커밋 금지
- Notion 토큰은 httpOnly 쿠키 세션으로 관리

## API 엔드포인트

### Recordings (업로드 모드 STT 비활성화)
```
POST   /api/recordings              - 오디오 업로드 (STT 비활성화됨)
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

### Report
```
POST   /api/report/progressive      - 점진적 보고서 갱신 (3분마다 호출)
```

### Streaming
```
WS     /ws/stt                      - 실시간 스트리밍 STT WebSocket
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
- **날짜**: 2026-02-16
- **브랜치**: main
- **마지막 커밋**: `ee8e105` Feat: dual-pannel 구현
- **빌드 상태**: 성공 (Next.js 빌드 통과, 백엔드 import 정상)
- **테스트 상태**: E2E 테스트 완료
- **진행 상태**: STT 추상화 + OpenAI 전환 완료 / 미커밋 상태

## 새 세션 시작
```
"HANDOFF.md 읽고 이어서 작업해줘"
```
