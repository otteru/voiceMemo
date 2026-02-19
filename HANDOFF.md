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
│   │   │   ├── return_zero.py     # Return Zero STT 프로바이더
│   │   │   └── whisper_live.py    # WhisperLive 로컬 STT 프로바이더 (NEW)
│   │   ├── llm_summarizer.py      # LLM 서비스 (summarize_async + generate_progressive_report_async)
│   │   └── notion_client.py       # Notion API 클라이언트
│   ├── schemas/
│   │   ├── notion.py              # Notion Pydantic 스키마
│   │   ├── recording.py           # Recording Pydantic 스키마
│   │   └── report.py              # 점진적 보고서 스키마 (ProgressiveReportRequest/Response)
│   ├── models/
│   │   └── recording.py           # Recording DB 모델
│   └── core/
│       ├── config.py              # 환경변수 설정 (stt_provider, whisper_live_server_url 등)
│       ├── security.py            # 세션 관리 (httpOnly 쿠키)
│       └── database.py            # SQLAlchemy 비동기 ORM
├── tests/
│   ├── conftest.py                # pytest 픽스처
│   ├── test_api.py                # API 엔드포인트 통합 테스트 (모킹)
│   ├── test_notion_unit.py        # NotionService 단위 테스트 (모킹)
│   ├── test_notion.py             # Notion 실제 API 연동 테스트 (.env 사용)
│   ├── test_stt.py                # STT 수동 테스트 (스크립트)
│   ├── test_llm_summary.py        # LLM 수동 테스트 (스크립트)
│   └── stt_benchmark/             # STT 벤치마크 테스트 (4개 모델 비교)
│       ├── run_all.py             # 4개 모델 순차 실행 + 결과 비교
│       ├── test_return_zero.py    # Return Zero STT 벤치마크
│       ├── test_openai_whisper.py # OpenAI Whisper API 벤치마크
│       ├── test_naver_clova.py    # Naver CLOVA Speech 벤치마크
│       └── test_whisper_live.py   # WhisperLive 로컬 STT 벤치마크
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
├── docs/                          # 문서 (STT 모델 참고, BM 분석 등)
│   └── Project.md                 # 프로젝트 기획 + BM 분석
├── outputs/
│   ├── audio/test_audio.wav       # STT 벤치마크 테스트 음원 (16MB)
│   └── stt/                       # STT 결과 파일
│       └── whisper_live_result.txt # WhisperLive 테스트 결과
├── pyproject.toml                 # pytest 설정 (pythonpath)
├── requirements.txt               # Python 의존성
├── CLAUDE.md                      # 프로젝트 개요
└── HANDOFF.md                     # 이 파일
```

## 완료된 작업

### 인프라 ~ 듀얼 패널 (2026-02-05 ~ 14)
- [x] FastAPI 앱 구조 + SQLAlchemy + 세션 관리
- [x] Recordings/Notion/Streaming/Report API
- [x] Return Zero / OpenAI Realtime STT 프로바이더
- [x] 실시간 WebSocket STT + AudioWorklet
- [x] 듀얼 패널 + 점진적 보고서 UI
- [x] 에러 수정 (Ctrl+C 종료, 녹음 중지 버그)

### BM 분석 + 로컬 STT 리서치 (2026-02-18, 이전 세션)
- [x] STT API 비용 분석 (OpenAI, Google, Deepgram, Naver 등 비교)
- [x] BM 실현 가능성 검토 → API 기반은 마진 25% (너무 낮음)
- [x] 오픈소스 STT 솔루션 리서치 (WhisperLive, Vosk, SenseVoice, FunASR, 한국어 fine-tuned Whisper)
- [x] AWS 셀프호스팅 비용 분석 → 50명+ 유저 시 60-70% 마진 가능
- [x] WhisperLive 벤치마크 테스트 코드 작성 + 실행 성공

### WhisperLive 프로바이더 통합 (2026-02-18, 이번 세션)
- [x] WhisperLiveProvider 구현 (`app/services/stt/whisper_live.py`)
  - STTProvider ABC 상속, stream_transcribe() 구현
  - 누적 응답(lines 배열) → 증분 결과(seq/final/text) 변환 로직
  - 24kHz → 16kHz PCM 리샘플링 (Whisper 모델 요구사항)
  - 타임스탬프 문자열 파싱 (`"0:01:23"` → float 초)
- [x] 팩토리에 `"whisper_live"` 분기 추가 (`app/services/stt/__init__.py`)
- [x] config에 `whisper_live_server_url`, `whisper_live_recv_timeout` 추가
- [x] 통합 테스트 성공 (프론트 → 백엔드 → WhisperLive 서버 → 실시간 전사 표시)

## 진행 중인 작업

### WhisperLive 품질/안정성 개선 (60% 완료)
- **현재 상태**: 연동 동작 확인, small 모델 한국어 인식 정확도 낮음
- **확인된 문제**:
  1. Whisper small 모델 한국어 오인식 다수 (예: "그림을 부동가기 시작했습니다")
  2. 빠르게 말하면 VAD가 구간을 못 나눠서 이탤릭(interim)만 계속 늘어남
  3. 녹음 중지 시 종료까지 시간이 걸릴 수 있음 (recv_timeout 대기)
- **해결 방향**:
  - `--buffer_trimming sentence` 옵션으로 문장 단위 분할
  - `large-v3` 모델 또는 한국어 fine-tuned 모델로 정확도 개선
  - `mlx-whisper` 설치로 Apple Silicon 속도 개선

## 다음에 해야 할 작업

### 1. WhisperLive 인식 품질 개선 (최우선)
- [ ] `pip install mlx-whisper` 설치 후 재테스트 (속도 개선 확인)
- [ ] `--model large-v3` 로 large 모델 테스트
- [ ] 한국어 fine-tuned 모델 테스트 (seastar105/Korean-Whisper 등)
- [ ] `--buffer_trimming sentence --buffer_trimming_sec 15` 옵션 효과 확인

### 2. WhisperLive 녹음 종료 안정성
- [ ] 녹음 중지 시 recv_timeout 동안 서버가 빈 응답을 계속 보내면 종료가 지연되는 문제
- [ ] drain_deadline 패턴 적용 (send_done 이후 절대 시간 기반 종료)

### 3. STT 벤치마크 전체 비교
- [ ] `python -m tests.stt_benchmark.run_all` 로 4개 모델 동시 비교
- [ ] 비교 항목: 인식 정확도, 속도, 비용

### 4. BM 결정
- [ ] 로컬 STT 품질이 서비스 가능 수준인지 판단
- [ ] API vs 셀프호스팅 최종 결정
- [ ] 가격 정책 확정

### 5. 기존 버그/개선
- [ ] E2E 테스트 (녹음 → 중지 → eos_ack 확인)
- [ ] UI 리디자인

## 주의사항

### WhisperLive 서버 실행 방법 (터미널 3개 필요)
```bash
# 터미널 1: WhisperLive STT 서버 (포트 9090)
whisperlivekit-server --model small --language ko --port 9090 --pcm-input \
  --buffer_trimming sentence --buffer_trimming_sec 15

# 터미널 2: FastAPI 백엔드 (포트 8000)
uvicorn app.main:app --reload

# 터미널 3: Next.js 프론트엔드 (포트 3000)
cd frontend && npm run dev
```

### WhisperLive 환경변수 (.env)
```env
STT_PROVIDER=whisper_live
WHISPER_LIVE_SERVER_URL=ws://localhost:9090/asr
```

### WhisperLive 프로토콜 (중요)
- 서버는 WebSocket `/asr` 엔드포인트에서 **바이트만** 수신
- JSON 메시지를 보내면 에러 발생 → 연결 종료됨
- 연결 직후 서버가 config JSON을 먼저 보냄 (`{"type": "config", "useAudioWorklet": true}`)
- 클라이언트는 PCM Int16 바이트를 전송 (16kHz, `--pcm-input` 필수)
- 서버 응답 형식: `{"status": "...", "lines": [...], "buffer_transcription": "..."}`
  - `lines[].text`: 전사 텍스트
  - `lines[].start`/`end`: 타임스탬프 (`"0:01:23"` 형식 문자열)
  - `lines[].speaker`: 화자 번호
- 서버는 매번 **전체 누적 결과**를 보냄 → 이전과 비교하여 새 부분만 추출
- 프론트엔드가 24kHz PCM을 보내면 WhisperLiveProvider가 16kHz로 리샘플링

### WhisperLive 벤치마크 테스트 (파일 기반)
```bash
# 1. 서버 실행 (별도 터미널, --pcm-input 불필요 - WAV 파일은 헤더 포함)
whisperlivekit-server --model small --language ko --port 9090

# 2. 테스트 실행
python -m tests.stt_benchmark.test_whisper_live

# 결과 파일: outputs/stt/whisper_live_result.txt
```

### 포트 충돌 주의
- WhisperLive와 FastAPI 모두 기본 포트 8000 사용
- WhisperLive를 `--port 9090`으로 실행하고 `WHISPER_LIVE_SERVER_URL=ws://localhost:9090/asr` 설정 필수

### BM 핵심 수치 (docs/Project.md)
- OpenAI Whisper: $0.006/분, gpt-4o-mini STT: $0.003/분
- 학생 월 50~80시간 강의 → API 비용 $9~$28.8/월
- API 기반 판매가 2만원 시 마진 ~25% (불가)
- 셀프호스팅 (AWS g4dn.xlarge $0.53/hr): 50명+ 시 60-70% 마진

### 환경 의존성
- **ffmpeg 필수**: `brew install ffmpeg`
- **Python 환경**: conda `fastapi`, Python 3.13
- **WhisperLive**: `pip install "whisperlivekit[mlx-whisper]"` (MLX 권장)
- **Node 환경**: Next.js 16, React 19

### 보안
- `.env` 파일 절대 커밋 금지
- Notion 토큰은 httpOnly 쿠키 세션으로 관리

## 아키텍처

### 실시간 모드 흐름 (완성)
```
녹음 시작 → STT 좌측 패널 실시간 표시
         → 3분마다 LLM 보고서 → 우측 패널에 갱신 표시
         → 녹음 종료 → eos_ack 대기 → 최종 보고서 화면
         → 사용자 선택: Notion 저장 / 복사 / 새 녹음
```

### STT 프로바이더 추상화
- `STT_PROVIDER` 환경변수로 전환 (`"openai"` | `"return_zero"` | `"whisper_live"`, 기본값: `"openai"`)
- OpenAI: Realtime Transcription API (server_vad, gpt-4o-mini-transcribe, 24kHz)
- Return Zero: VITO 스트리밍 STT (JWT 토큰 자동 재발급)
- WhisperLive: 로컬 Whisper 서버 (WebSocket `/asr`, 16kHz PCM, 누적→증분 변환)

### WhisperLive 데이터 흐름
```
브라우저(24kHz PCM) → 백엔드(/ws/stt) → WhisperLiveProvider
                                         ├── 24kHz→16kHz 리샘플링
                                         ├── WhisperLive 서버(:9090/asr)로 전송
                                         ├── 누적 응답 수신 (lines 배열)
                                         └── 증분 결과로 변환 (seq/final/text)
                                       → 프론트에 JSON 중계
```

## 관련 파일 (이번 세션에서 생성/수정)
- `app/services/stt/whisper_live.py` - WhisperLive STT 프로바이더 (NEW)
- `app/services/stt/__init__.py` - 팩토리에 whisper_live 분기 추가
- `app/core/config.py` - whisper_live_server_url, recv_timeout 설정 추가

## 마지막 상태
- **날짜**: 2026-02-18
- **브랜치**: main
- **마지막 커밋**: `ac5352c` Fix: 녹음 중지 안되는 에러 수정
- **미커밋 변경**: whisper_live.py(NEW), __init__.py, config.py, HANDOFF.md
- **WhisperLive 연동**: 동작 확인 (small 모델, 한국어 인식 정확도 낮음)

## 새 세션 시작
```
"HANDOFF.md 읽고 이어서 작업해줘"
```
