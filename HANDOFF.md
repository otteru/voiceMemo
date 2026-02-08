# 작업 인계 문서

## 프로젝트 개요
**Voice Memo** - 강의 녹음 자동 정리 앱
- 대학생들이 수업 시간에 웹사이트를 켜놓으면 강의를 녹음하고, STT로 변환한 후 AI로 정리하여 노션에 저장하는 서비스

## 완료된 작업

### 1. 프로젝트 구조 생성 ✅
```
voiceMemo/
├── app/
│   ├── api/routes/
│   ├── services/
│   │   ├── rtzr_client.py      # STT 클라이언트
│   │   └── llm_summarizer.py   # LLM 요약 서비스
│   ├── langgraph/nodes/
│   ├── models/
│   └── core/
│       └── config.py
├── tests/
│   ├── test_stt.py
│   └── test_llm_summary.py
├── outputs/
│   ├── audio/                   # 오디오 파일
│   ├── stt/                     # STT 결과
│   └── summaries/               # LLM 요약 결과
├── .env
├── .gitignore
├── CLAUDE.md
├── HANDOFF.md
└── requirements.txt
```

### 2. Return Zero 스트리밍 STT API 연동 ✅
- **파일**: `app/services/rtzr_client.py`
- WebSocket 기반 실시간 STT 구현
- OAuth2 인증 (토큰 6시간 유효)
- 주요 메서드:
  - `_get_token()`: JWT 토큰 발급 및 재사용
  - `stream_transcribe()`: 실시간 오디오 스트림 처리
  - `transcribe_file()`: 파일을 청크로 나눠서 스트리밍 변환

### 3. LangChain + OpenRouter LLM 정리 기능 ✅
- **파일**: `app/services/llm_summarizer.py`
- OpenRouter API 연동 (`arcee-ai/trinity-large-preview:free` 모델)
- 강의 내용을 보고서 형식으로 자동 정리
- 주요 기능:
  - 📝 강의 개요 요약
  - 🔑 핵심 키워드 추출
  - 📚 주요 내용 구조화
  - 💡 중요 포인트 추출
- 동기/비동기 메서드 모두 제공

### 4. 환경 설정 ✅
- **파일**: `app/core/config.py`
- pydantic-settings로 환경변수 관리
- `.env` 파일:
  ```
  return_zero_client_id=UiTVAUpj5ksFwM36O6Ve
  return_zero_client_secret=Wc90rvaf2ynFM2pvtVo7mUv4fX-LNJEWXxpZZSQj
  OPENROUTER_API_KEY=sk-or-v1-...
  NOTION_API_KEY=ntn_...
  NOTION_PAGE_URL=https://www.notion.so/...
  ```

### 5. 테스트 스크립트 작성 ✅
- **파일**:
  - `tests/test_stt.py` - STT 테스트
  - `tests/test_llm_summary.py` - LLM 요약 테스트
- **주요 설정**:
  - `chunk_size=8192` (8KB)
  - `sample_rate=44100` (실제 WAV 파일에 맞춤)
  - `encoding="LINEAR16"`

### 6. 의존성 설치 ✅
- **파일**: `requirements.txt`
  ```
  fastapi==0.109.0
  uvicorn==0.27.0
  python-dotenv==1.0.0
  httpx>=0.27.0
  pydantic>=2.10.0
  pydantic-settings>=2.7.0
  websockets==12.0
  langchain>=0.1.0
  langchain-openai>=0.0.5
  openai>=1.0.0
  notion-client==2.7.0
  ```
- Python 3.13 호환 이슈 해결

### 7. 파일 구조 정리 ✅
- `tests/` 폴더 생성 및 테스트 파일 이동
- `outputs/` 폴더 구조 생성:
  - `outputs/audio/` - 테스트 오디오 파일
  - `outputs/stt/` - STT 변환 결과
  - `outputs/summaries/` - LLM 요약 결과
- `.gitignore`에 `outputs/` 추가

### 8. ffmpeg 설치 및 오디오 변환 ✅
- MP3 → WAV 변환 (스트리밍 STT는 raw audio만 지원)
- 명령어: `ffmpeg -i input.mp3 -ar 16000 -ac 1 -acodec pcm_s16le output.wav`

### 9. Notion API 연동 ✅
- **파일**: `app/services/notion_client.py`
- 커뮤니티 SDK 사용: `notion-client` (ramnes/notion-sdk-py)
- 주요 기능:
  - `extract_page_id()`: Notion URL에서 페이지 ID 추출
  - `create_lecture_page()`: 강의 노트 페이지 생성
  - `_convert_summary_to_blocks()`: 마크다운 → Notion 블록 변환
- 지원 마크다운: `#` 제목, `-` 리스트, `1.` 숫자 리스트
- 환경변수:
  - `NOTION_API_KEY`: Integration Token (ntn_로 시작)
  - `NOTION_PAGE_URL`: 기본 저장 위치 (선택)
- **테스트**: `tests/test_notion.py` 실행 성공 ✅

## 현재 상태

### Backend 파이프라인 완성 ✅
```
오디오 파일 → STT (Return Zero) → LLM 정리 (OpenRouter) → Notion 저장 ✅
```

- **STT 테스트**: `test_audio.wav` → `outputs/stt/output.txt` ✅
- **LLM 요약 테스트**: `output.txt` → `outputs/summaries/summary_report.txt` ✅
- **Notion 연동 테스트**: 페이지 생성 성공 ✅
- 실시간 스트리밍 방식으로 결과 수신 확인

### Frontend 구조 개선 완료 ✅ (2026-02-05)

#### 완료된 작업
1. **타입 정의 파일 분리** → `frontend/types/index.ts` ✅
   - AppState, ProcessingStep, Recording 등 모든 타입 정의

2. **API 레이어 구조** → `frontend/lib/api.ts` ✅
   - recordingsApi: list, get, create, delete, getStatus
   - notionApi: checkConnection, saveConfig, disconnect, save
   - httpOnly 쿠키 지원 (credentials: 'include')
   - 에러 핸들링 포함 (ApiError class)

3. **입력 검증 추가** → `frontend/lib/validations.ts` ✅
   - Zod 스키마 정의 (Notion token, Database ID 등)
   - safeValidate 유틸리티 함수
   - `app/settings/page.tsx`에 적용

4. **환경 변수 설정** ✅
   - `.env.example`, `.env.local` 생성
   - `NEXT_PUBLIC_API_URL=http://localhost:8000` 설정

5. **에러 처리 개선** ✅
   - `app/layout.tsx` - Toaster 컴포넌트 추가
   - `app/page.tsx` - 마이크 권한 에러 처리
   - `app/settings/page.tsx` - 저장/해제 알림
   - Toast 알림 (sonner) 전역 적용

6. **성능 최적화** ✅
   - useCallback 적용: handleRecordToggle, handleSave, handleReset, formatTime
   - React.memo 적용: FeatureCard 컴포넌트

#### 🚨 알려진 보안 이슈 (Backend 구현 시 해결 예정)
- **Notion Token을 localStorage에 평문 저장**
  - ❌ 현재: localStorage에 평문 저장 (XSS 취약)
  - ✅ 계획: httpOnly 쿠키 세션에 저장

## 다음에 해야 할 작업

### 🔥 우선순위 1: FastAPI Backend 구축 (다음 작업)

#### 1.1 프로젝트 기본 구조
- [ ] FastAPI 프로젝트 초기화 (backend/ 폴더)
- [ ] 폴더 구조 생성
  ```
  backend/
  ├── app/
  │   ├── main.py              # FastAPI 앱
  │   ├── api/                 # API 라우터
  │   │   ├── recordings.py
  │   │   └── notion.py
  │   ├── services/            # 비즈니스 로직
  │   │   ├── stt.py          # 기존 rtzr_client.py 활용
  │   │   ├── ai_summary.py   # 기존 llm_summarizer.py 활용
  │   │   └── notion.py       # 기존 notion_client.py 활용
  │   └── core/
  │       ├── config.py       # 기존 파일 활용
  │       └── security.py     # 세션/인증 관리
  ```

#### 1.2 인증/세션 관리
- [ ] httpOnly 쿠키 기반 세션 구현
- [ ] Notion 토큰을 서버 세션에 저장 (localStorage 대체)
- [ ] CORS 설정 (http://localhost:3000 허용)

#### 1.3 Notion API 엔드포인트
- [ ] `POST /api/notion/config` - Notion 설정 저장 (세션)
- [ ] `GET /api/notion/status` - 연결 상태 확인
- [ ] `POST /api/notion/disconnect` - 연결 해제
- [ ] `POST /api/notion/save` - 노션에 페이지 생성

#### 1.4 녹음 처리 API
- [ ] `POST /api/recordings` - 오디오 파일 업로드 및 처리
- [ ] `GET /api/recordings` - 녹음 목록 조회
- [ ] `GET /api/recordings/{id}` - 녹음 상세
- [ ] `GET /api/recordings/{id}/status` - 처리 상태 (폴링)
- [ ] `DELETE /api/recordings/{id}` - 녹음 삭제

#### 1.5 기존 서비스 통합
- [ ] `rtzr_client.py` → `app/services/stt.py` 통합
- [ ] `llm_summarizer.py` → `app/services/ai_summary.py` 통합
- [ ] `notion_client.py` → `app/services/notion.py` 통합
- [ ] 비동기 처리 (BackgroundTasks 또는 Celery)

### 우선순위 2: Frontend-Backend 연동
- [ ] API 호출 테스트
- [ ] localStorage → httpOnly 쿠키로 변경
- [ ] 실제 데이터로 UI 테스트
- [ ] 전체 플로우 테스트 (녹음 → STT → AI → Notion)

### 우선순위 3: 통합 테스트 및 배포
- [ ] 전체 파이프라인 통합 테스트
- [ ] E2E 테스트
- [ ] 배포 설정 (Vercel + Railway/Render)

## 주요 학습 내용

### 1. 스트리밍 STT의 이해
- **지원 포맷**: LINEAR16, FLAC, OPUS (MP3 불가!)
- **이유**: 청크로 나눴을 때 raw audio만 유효함
  - WAV: raw 샘플 → 청크로 나눠도 이해 가능 ✅
  - MP3: 압축 데이터 → 청크로 나누면 의미 없음 ❌

### 2. async/await의 필요성
- API 호출은 시간이 오래 걸림 → 기다리는 동안 다른 작업 가능
- WebSocket: 양방향 실시간 통신

### 3. sample_rate 중요성
- 코드 설정 != 실제 파일 → 이상한 텍스트 출력
- `ffprobe`로 실제 파일 정보 확인 필수

### 4. LangChain vs LangGraph
- **LangChain**: 간단한 LLM 호출에 적합 (현재 사용)
- **LangGraph**: 복잡한 워크플로우에 적합 (나중에 전환 예정)
- 일단 간단하게 시작하고 필요할 때 확장

## 주의사항

### 1. Return Zero API 제약사항
- 토큰 유효기간: 6시간 (자동 재발급 구현됨)
- 스트리밍 STT 지원 포맷: LINEAR16, FLAC, OPUS만
- WebSocket URL 파라미터로 설정 전달

### 2. OpenRouter API
- 무료 모델 사용 중: `arcee-ai/trinity-large-preview:free`
- rate limit 주의
- 프롬프트 최적화 필요 시 `temperature`, `max_tokens` 조정

### 3. 환경변수 보안
- `.env` 파일은 절대 커밋하지 말 것
- `.gitignore`에 `.env` 추가 필수
- API 키 노출 주의

### 4. chunk_size 조정
- 너무 작으면: 서버 부하 (ResourceExhausted 에러)
- 너무 크면: 실시간성 저하
- 권장: 8192 (8KB)

### 5. 파일 경로
- 테스트 파일들은 `tests/` 폴더
- 출력 파일들은 `outputs/` 폴더
- `outputs/`는 `.gitignore`에 추가됨

### 6. Notion API 주의사항
- **Integration 연결 필수**: Integration을 만든 후 사용할 페이지에 연결 필요
  - 페이지 우측 상단 "⋯" → "Connections" → Integration 선택
- **토큰 형식**: `ntn_`으로 시작 (2026년 기준)
- **커뮤니티 SDK 사용**: 공식 Python SDK 없음, `notion-client` 사용
- **마크다운 제한**: 복잡한 마크다운은 지원 안 됨 (기본적인 형식만)
- **블록 제한**: 한 번에 최대 100개 블록 생성 가능

### 7. FastAPI Backend 주의사항 (2026-02-07 추가)

#### config.py IDE 경고
```python
settings = Settings()  # Arguments missing... 경고 발생
```
- **원인**: IDE가 .env 파일 자동 로드를 모름
- **실제**: 실행하면 정상 동작 (pydantic-settings가 .env 읽음)
- **해결**: `# type: ignore` 추가 또는 무시

#### database.py 타입 힌팅
```python
# ❌ 잘못된 타입
async def get_db() -> AsyncSession:
    yield session  # yield 사용 → 제너레이터!

# ✅ 올바른 타입
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    yield session
```
- `yield` 사용 시 반환 타입은 `AsyncGenerator`여야 함

#### 스트리밍 STT 처리 방식
- **현재**: 방식 1 (파일 업로드 후 스트리밍 STT)
  - 브라우저 녹음 → Blob → HTTP POST → 서버 저장 → transcribe_file()
  - python-multipart 필요 (FormData 파일 업로드)
- **향후**: 방식 2 (실시간 WebSocket 스트리밍)
  - 브라우저 녹음 → WebSocket → stream_transcribe()
  - python-multipart 불필요
- 상세 내용: `future.md` 참조

#### python-multipart 필요성
- **용도**: FastAPI에서 FormData 파일 업로드 처리
- **사용처**: `POST /api/recordings` (오디오 파일 업로드)
- **프론트엔드**: `FormData.append("audio", blob)` → HTTP POST
- **백엔드**: `UploadFile = File(...)` → python-multipart 필요
- **없으면**: `RuntimeError: Form data requires "python-multipart"`

## 관련 파일

### Backend 핵심 파일

**FastAPI 앱:**
- `app/main.py` - FastAPI 메인 앱 (CORS, 세션 미들웨어)
- `app/core/config.py` - 환경변수 설정
- `app/core/security.py` - httpOnly 쿠키 세션 관리
- `app/core/database.py` - 비동기 DB 설정 및 세션

**모델 & 스키마:**
- `app/models/recording.py` - Recording 데이터 모델
- `app/schemas/` - Pydantic 스키마 (예정)

**서비스:**
- `app/services/rtzr_client.py` - Return Zero STT 클라이언트
- `app/services/llm_summarizer.py` - LLM 요약 서비스
- `app/services/notion_client.py` - Notion API 클라이언트

**테스트:**
- `tests/test_stt.py` - STT 테스트
- `tests/test_llm_summary.py` - LLM 요약 테스트
- `tests/test_notion.py` - Notion 연동 테스트

**설정:**
- `.env` - API 인증 정보
- `requirements.txt` - Python 의존성

### Frontend 핵심 파일
- `frontend/types/index.ts` - 전역 타입 정의
- `frontend/lib/api.ts` - API 레이어 (Backend 호출)
- `frontend/lib/validations.ts` - Zod 입력 검증
- `frontend/app/page.tsx` - 메인 페이지 (녹음 UI)
- `frontend/app/recordings/page.tsx` - 녹음 기록
- `frontend/app/settings/page.tsx` - 설정 (Notion 연동)
- `frontend/components/record-button.tsx` - 녹음 버튼
- `frontend/components/processing-status.tsx` - 처리 상태
- `frontend/.env.local` - 환경 변수 (API URL)

### 출력 파일
- `outputs/audio/test_audio.wav` - 테스트 오디오
- `outputs/stt/output.txt` - STT 결과
- `outputs/summaries/summary_report.txt` - LLM 요약 결과

### 문서
- `CLAUDE.md` - 프로젝트 개요 및 기술 스택
- `HANDOFF.md` - 작업 인계 문서
- `future.md` - 향후 개선 계획 (스트리밍 STT 방식 비교)

## 참고 자료
- [RTZR 스트리밍 STT WebSocket 문서](https://developers.rtzr.ai/docs/stt-streaming/websocket/)
- [RTZR 인증 가이드](https://developers.rtzr.ai/docs/authentications/)
- [OpenRouter API 문서](https://openrouter.ai/docs)
- [LangChain 문서](https://python.langchain.com/docs/get_started/introduction)
- [Notion API 문서](https://developers.notion.com/reference/intro)
- [notion-sdk-py GitHub](https://github.com/ramnes/notion-sdk-py)

### 10. FastAPI Backend 인프라 구축 ✅ (2026-02-07)

#### 10.1 FastAPI 기본 설정
- **파일**: `app/main.py`
- FastAPI 앱 생성 및 기본 설정
- CORS 미들웨어 (http://localhost:3000 허용)
- 세션 미들웨어 (httpOnly 쿠키)
- Health Check 엔드포인트 (`/`, `/health`)

#### 10.2 세션 관리
- **파일**: `app/core/security.py`
- httpOnly 쿠키 기반 세션 관리
- `SessionManager` 클래스:
  - `set_notion_config()`: Notion 토큰/DB ID 저장
  - `get_notion_config()`: 세션에서 조회
  - `is_notion_connected()`: 연결 상태 확인
  - `clear_notion_config()`: 세션 삭제

#### 10.3 데이터베이스 설정
- **파일**: `app/core/database.py`
- SQLAlchemy 비동기 ORM 설정
- SQLite (`sqlite+aiosqlite:///./voicememo.db`)
- `get_db()`: FastAPI 의존성 주입용 DB 세션
- `init_db()`: 테이블 자동 생성
- **중요**: `get_db()` 반환 타입은 `AsyncGenerator[AsyncSession, None]` (yield 사용)

#### 10.4 Recording 모델
- **파일**: `app/models/recording.py`
- 녹음 기록 데이터 모델:
  - `id`: 고유 식별자 (UUID)
  - `title`: 녹음 제목
  - `duration`: 녹음 길이 (초)
  - `audio_file_path`: 오디오 파일 경로 (Optional - 스트리밍 시 null)
  - `stt_text`: STT 변환 결과
  - `summary`: AI 요약 결과
  - `notion_url`: Notion 페이지 URL
  - `status`: 처리 상태 (idle → stt → ai → notion → complete)
  - `progress`: 진행률 (0-100)

#### 10.5 의존성 업데이트
- **파일**: `requirements.txt`
- 추가된 패키지:
  - `sqlalchemy>=2.0.0` (ORM)
  - `aiosqlite>=0.19.0` (비동기 SQLite)
  - `python-multipart>=0.0.6` (FormData 파일 업로드)
  - `itsdangerous>=2.1.2` (세션 암호화)

#### 10.6 환경변수 추가
- **파일**: `.env`
- `SESSION_SECRET_KEY`: FastAPI 세션 관리용

## 현재 상태 (2026-02-07 업데이트)

### ✅ Phase 1 완료: FastAPI Backend 인프라
- FastAPI 기본 설정 (main.py, CORS)
- httpOnly 쿠키 세션 관리 (security.py)
- 데이터베이스 설정 및 모델 (database.py, Recording)
- requirements.txt 업데이트

### 🔄 Phase 2 진행 중: Notion API 구현
- [ ] Notion API 스키마 작성 (app/schemas/notion.py)
- [ ] Notion API 라우터 구현 (app/api/routes/notion.py)
- [ ] main.py에 라우터 등록

### 📅 다음 단계
1. **Notion API 스키마 작성**
   - `app/schemas/notion.py` 생성
   - NotionConfigRequest, NotionStatusResponse 등 Pydantic 스키마

2. **Notion API 라우터 구현**
   - `app/api/routes/notion.py` 생성
   - POST /api/notion/config (설정 저장)
   - GET /api/notion/status (연결 상태)
   - POST /api/notion/disconnect (연결 해제)
   - POST /api/notion/save (페이지 생성)

3. **Recordings API 구현** (Phase 3)
   - 녹음 업로드 및 처리 파이프라인
   - STT → AI → Notion 자동 처리
   - 상태 폴링 API

## 마지막 상태
- **날짜**: 2026-02-07
- **Python 환경**: conda (fastapi), Python 3.13
- **Node 환경**: Node.js (Next.js 16, React 19)
- **브랜치**: main
- **마지막 작업**:
  - Backend: FastAPI 인프라 구축 완료 ✅
  - Phase 1 완료, Phase 2 시작
- **테스트 상태**:
  - STT 변환 성공 ✅
  - LLM 요약 성공 ✅
  - Notion 페이지 생성 성공 ✅
  - FastAPI 서버: 미실행 (라우터 구현 전)
- **컨텍스트 사용량**: ~88k 토큰
- **다음 단계**: Notion API 스키마 및 라우터 구현

## 🚀 새 세션 시작 방법

### Backend 작업 이어서
```bash
# 환경 활성화
conda activate fastapi

# 의존성 확인
pip list | grep -E "langchain|openai|notion"

# 테스트 실행
PYTHONPATH=. python tests/test_stt.py
PYTHONPATH=. python tests/test_llm_summary.py
PYTHONPATH=. python tests/test_notion.py
```

### Frontend 작업 이어서
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### FastAPI Backend 시작 (다음 작업)
```
"HANDOFF.md 읽고 FastAPI Backend부터 만들어줘"
```

또는

```
"backend/app/main.py 부터 만들어서 Frontend와 연동하자"
```

## 📋 API 엔드포인트 명세 (Frontend 기대)

### Recordings API
```typescript
// 녹음 생성
POST /api/recordings
Content-Type: multipart/form-data
Body: { audio: File, title?: string }
Response: { id: string, status: ProcessingStep, message: string }

// 녹음 목록
GET /api/recordings
Response: Recording[]

// 녹음 상세
GET /api/recordings/{id}
Response: Recording

// 처리 상태 (폴링)
GET /api/recordings/{id}/status
Response: { status: string, progress: number }

// 녹음 삭제
DELETE /api/recordings/{id}
Response: void
```

### Notion API
```typescript
// 연결 상태 확인
GET /api/notion/status
Response: { connected: boolean }

// 설정 저장 (세션에 저장)
POST /api/notion/config
Body: { token: string, databaseId: string }
Response: { success: boolean }

// 연결 해제
POST /api/notion/disconnect
Response: { success: boolean }

// 노션에 저장
POST /api/notion/save
Body: { recordingId: string, summary: string, title: string }
Response: { url: string }
```

## 주요 학습 내용 (Notion API)

### Notion API 토큰 형식 변경
- **예전**: `secret_xxxxx...`
- **현재 (2026)**: `ntn_xxxxx...`

### 공식 SDK vs 커뮤니티 SDK
- Notion은 **JavaScript SDK만 공식 지원**
- Python은 **커뮤니티 SDK 사용**: `notion-client` (ramnes/notion-sdk-py)
- 2.4k+ stars, 활발히 유지보수 중

### Integration 연결 필수
- Integration 만들기만 하면 안 됨
- **페이지에 연결**: 페이지 "⋯" → "Connections" → Integration 선택
- 이걸 안 하면 403 Forbidden 에러 발생
