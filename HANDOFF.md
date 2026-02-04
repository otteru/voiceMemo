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

### 전체 파이프라인 완성 ✅
```
오디오 파일 → STT (Return Zero) → LLM 정리 (OpenRouter) → Notion 저장 ✅
```

- **STT 테스트**: `test_audio.wav` → `outputs/stt/output.txt` ✅
- **LLM 요약 테스트**: `output.txt` → `outputs/summaries/summary_report.txt` ✅
- **Notion 연동 테스트**: 페이지 생성 성공 ✅
- 실시간 스트리밍 방식으로 결과 수신 확인

## 다음에 해야 할 작업

### Phase 1: 전체 파이프라인 통합 테스트 (다음 작업)
1. 통합 테스트 스크립트 작성 (`tests/test_pipeline.py`)
   - STT → LLM → Notion 전체 흐름 테스트
   - 오디오 파일 입력 → Notion 페이지 생성 확인
2. 에러 핸들링 강화
3. 로깅 추가

### Phase 2: FastAPI 웹 서버
1. 오디오 업로드 API (`app/api/routes/upload.py`)
2. 실시간 스트리밍 WebSocket 엔드포인트
3. 강의 처리 API (`app/api/routes/lecture.py`)
   - STT → LLM → Notion 통합

### Phase 3: 프론트엔드
1. 웹 녹음 인터페이스 (HTML + JavaScript)
2. Web Audio API로 마이크 녹음
3. WebSocket으로 실시간 전송
4. 진행 상황 표시 UI

### Phase 4: LangGraph 고도화 (선택)
1. LangGraph 워크플로우 구현 (`app/langgraph/`)
   - 요약 노드
   - 키워드 추출 노드
   - 구조화 노드
   - 조건부 분기 (요약 품질 검증)
2. 복잡한 워크플로우로 전환

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

## 관련 파일

### 핵심 파일
- `app/services/rtzr_client.py` - Return Zero STT 클라이언트
- `app/services/llm_summarizer.py` - LLM 요약 서비스
- `app/services/notion_client.py` - Notion API 클라이언트
- `app/core/config.py` - 환경변수 설정
- `tests/test_stt.py` - STT 테스트
- `tests/test_llm_summary.py` - LLM 요약 테스트
- `tests/test_notion.py` - Notion 연동 테스트
- `.env` - API 인증 정보

### 출력 파일
- `outputs/audio/test_audio.wav` - 테스트 오디오
- `outputs/stt/output.txt` - STT 결과
- `outputs/summaries/summary_report.txt` - LLM 요약 결과

### 문서
- `CLAUDE.md` - 프로젝트 개요 및 기술 스택
- `HANDOFF.md` - 작업 인계 문서
- `requirements.txt` - Python 의존성

## 참고 자료
- [RTZR 스트리밍 STT WebSocket 문서](https://developers.rtzr.ai/docs/stt-streaming/websocket/)
- [RTZR 인증 가이드](https://developers.rtzr.ai/docs/authentications/)
- [OpenRouter API 문서](https://openrouter.ai/docs)
- [LangChain 문서](https://python.langchain.com/docs/get_started/introduction)
- [Notion API 문서](https://developers.notion.com/reference/intro)
- [notion-sdk-py GitHub](https://github.com/ramnes/notion-sdk-py)

## 마지막 상태
- Python 환경: conda (fastapi)
- Python 버전: 3.13
- 브랜치: main
- 마지막 작업: Notion API 연동 완료
- 테스트 상태:
  - STT 변환 성공 ✅
  - LLM 요약 성공 ✅
  - Notion 페이지 생성 성공 ✅
- **다음 단계**: 전체 파이프라인 통합 테스트

## 새 세션 시작 시
1. `HANDOFF.md`와 `CLAUDE.md` 읽기
2. 환경 확인: `conda activate fastapi`
3. 의존성 확인: `pip list | grep -E "langchain|openai|notion"`
4. **다음 작업**: 전체 파이프라인 통합 테스트 (STT → LLM → Notion)
5. 테스트 실행:
   ```bash
   PYTHONPATH=. python tests/test_stt.py
   PYTHONPATH=. python tests/test_llm_summary.py
   PYTHONPATH=. python tests/test_notion.py
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
