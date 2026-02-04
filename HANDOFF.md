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
│   ├── langgraph/nodes/
│   ├── models/
│   └── core/
├── .env
├── CLAUDE.md
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

### 3. 환경 설정 ✅
- **파일**: `app/core/config.py`
- pydantic-settings로 환경변수 관리
- `.env` 파일:
  ```
  return_zero_client_id=UiTVAUpj5ksFwM36O6Ve
  return_zero_client_secret=Wc90rvaf2ynFM2pvtVo7mUv4fX-LNJEWXxpZZSQj
  ```

### 4. 테스트 스크립트 작성 ✅
- **파일**: `test_stt.py`
- 오디오 파일 → STT → txt 저장 검증 완료
- **주요 설정**:
  - `chunk_size=8192` (8KB)
  - `sample_rate=44100` (실제 WAV 파일에 맞춤)
  - `encoding="LINEAR16"`

### 5. 의존성 설치 ✅
- **파일**: `requirements.txt`
  ```
  fastapi>=0.109.0
  uvicorn>=0.27.0
  python-dotenv>=1.0.0
  httpx>=0.27.0
  pydantic>=2.10.0
  pydantic-settings>=2.7.0
  websockets>=12.0
  ```
- Python 3.13 호환 이슈 해결 (pydantic 버전 업그레이드)

### 6. ffmpeg 설치 및 오디오 변환 ✅
- MP3 → WAV 변환 (스트리밍 STT는 raw audio만 지원)
- 명령어: `ffmpeg -i input.mp3 -ar 16000 -ac 1 -acodec pcm_s16le output.wav`

## 현재 상태

### STT 테스트 성공 ✅
- `test_audio.wav` (44100 Hz, mono) → STT 변환 완료
- `output.txt`에 한국어 텍스트 저장 성공
- 실시간 스트리밍 방식으로 결과 수신 확인

## 다음에 해야 할 작업

### Phase 1: Notion API 연동
1. Notion API 클라이언트 작성 (`app/services/notion_client.py`)
2. STT 결과를 노션 페이지로 저장
3. 테스트 스크립트에 노션 저장 기능 추가

### Phase 2: LangGraph AI 정리 기능
1. LangGraph 워크플로우 구현 (`app/langgraph/`)
   - 요약 노드
   - 키워드 추출 노드
   - 구조화 노드
2. STT → AI 정리 → 노션 파이프라인 완성

### Phase 3: FastAPI 웹 서버
1. 오디오 업로드 API (`app/api/routes/upload.py`)
2. 실시간 스트리밍 WebSocket 엔드포인트
3. 강의 처리 API (`app/api/routes/lecture.py`)

### Phase 4: 프론트엔드
1. 웹 녹음 인터페이스 (HTML + JavaScript)
2. Web Audio API로 마이크 녹음
3. WebSocket으로 실시간 전송

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

## 주의사항

### 1. Return Zero API 제약사항
- 토큰 유효기간: 6시간 (자동 재발급 구현됨)
- 스트리밍 STT 지원 포맷: LINEAR16, FLAC, OPUS만
- WebSocket URL 파라미터로 설정 전달

### 2. 환경변수 보안
- `.env` 파일은 절대 커밋하지 말 것
- `.gitignore`에 `.env` 추가 필수

### 3. chunk_size 조정
- 너무 작으면: 서버 부하 (ResourceExhausted 에러)
- 너무 크면: 실시간성 저하
- 권장: 8192 (8KB)

## 관련 파일

### 핵심 파일
- `app/services/rtzr_client.py` - Return Zero STT 클라이언트 (스트리밍 방식)
- `app/core/config.py` - 환경변수 설정
- `test_stt.py` - STT 테스트 스크립트
- `.env` - API 인증 정보

### 문서
- `CLAUDE.md` - 프로젝트 개요 및 기술 스택
- `requirements.txt` - Python 의존성

## 참고 자료
- [RTZR 스트리밍 STT WebSocket 문서](https://developers.rtzr.ai/docs/stt-streaming/websocket/)
- [RTZR 인증 가이드](https://developers.rtzr.ai/docs/authentications/)

## 마지막 상태
- Python 환경: conda (fastapi)
- Python 버전: 3.13
- 테스트 상태: STT 변환 성공 ✅
- 다음 단계: Notion API 연동

## 새 세션 시작 시
1. `HANDOFF.md`와 `CLAUDE.md` 읽기
2. 환경 확인: `conda activate fastapi`
3. 다음 작업: Notion API 연동부터 시작
