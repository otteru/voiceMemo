# Voice Memo

강의 녹음을 자동으로 정리해주는 웹 서비스

## 개요

대학생들이 수업 시간에 웹사이트를 켜놓으면 강의를 녹음하고, STT로 변환한 후 AI로 정리하여 노션에 저장하는 서비스입니다.

## 주요 기능

- 🎤 실시간 강의 녹음
- 🔤 음성을 텍스트로 변환 (STT)
- 🤖 AI 기반 강의 내용 정리
- 📝 노션 자동 저장

## 기술 스택

- **Backend**: FastAPI, Python 3.13
- **STT**: Return Zero Streaming API
- **AI**: LangGraph (예정)
- **Storage**: Notion API (예정)

## 워크플로우

```
웹 녹음 → STT 변환 → AI 정리 → 노션 저장
```

## 현재 상태

- ✅ Return Zero 스트리밍 STT API 연동 완료
- ✅ 오디오 파일 → 텍스트 변환 테스트 성공
- ⏳ Notion API 연동 예정
- ⏳ LangGraph AI 정리 기능 예정
- ⏳ 웹 인터페이스 예정

## 설치 및 실행

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```
return_zero_client_id=your_client_id
return_zero_client_secret=your_client_secret
```

### 3. 테스트 실행

```bash
python test_stt.py
```

## 프로젝트 구조

```
voiceMemo/
├── app/
│   ├── api/routes/       # API 엔드포인트
│   ├── services/         # 외부 서비스 클라이언트
│   ├── langgraph/nodes/  # AI 워크플로우
│   ├── models/           # 데이터 모델
│   └── core/             # 설정 및 유틸리티
├── .env                  # 환경 변수 (git 제외)
└── requirements.txt      # Python 의존성
```

## 참고 문서

- [HANDOFF.md](HANDOFF.md) - 작업 인계 문서
- [CLAUDE.md](CLAUDE.md) - 프로젝트 개요
- [RTZR API 문서](https://developers.rtzr.ai/)

## 라이선스

MIT
