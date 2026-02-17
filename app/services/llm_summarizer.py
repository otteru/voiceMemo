"""
LLM 기반 강의 내용 요약 서비스
"""
from langchain_openai import ChatOpenAI
from app.core.config import settings


class LectureSummarizer:
    """강의 내용을 요약하는 LLM 서비스"""

    def __init__(self):
        """OpenRouter를 통한 LLM 초기화"""
        self.llm = ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            model="arcee-ai/trinity-large-preview:free",
            temperature=0.3,  # 일관성 있는 요약을 위해 낮은 temperature
        )

    def summarize(self, transcript: str) -> str:
        """
        강의 내용을 보고서 형식으로 요약

        Args:
            transcript: STT로 변환된 강의 텍스트

        Returns:
            보고서 형식으로 정리된 요약 텍스트
        """
        prompt = f"""
당신은 대학 강의를 정리하는 AI 비서입니다.

다음 강의 내용을 보고서 형식으로 정리해주세요:

{transcript}

다음 형식으로 작성해주세요:

# 강의 요약 보고서

## 📝 강의 개요
(3-5문장으로 강의 전체 내용 요약)

## 🔑 핵심 키워드
- 키워드1
- 키워드2
- 키워드3
- ...

## 📚 주요 내용
### 1. 주제1
- 세부 내용
- 세부 내용

### 2. 주제2
- 세부 내용
- 세부 내용

## 💡 중요 포인트
- 꼭 기억해야 할 핵심 개념
- 시험이나 과제에 나올 만한 내용
"""

        response = self.llm.invoke(prompt)
        return response.content

    async def summarize_async(self, transcript: str) -> str:
        """
        비동기 방식으로 강의 내용 요약

        Args:
            transcript: STT로 변환된 강의 텍스트

        Returns:
            보고서 형식으로 정리된 요약 텍스트
        """
        prompt = f"""
당신은 대학 강의를 정리하는 AI 비서입니다.

다음 강의 내용을 보고서 형식으로 정리해주세요:

{transcript}

다음 형식으로 작성해주세요:

# 강의 요약 보고서

## 📝 강의 개요
(3-5문장으로 강의 전체 내용 요약)

## 🔑 핵심 키워드
- 키워드1
- 키워드2
- 키워드3
- ...

## 📚 주요 내용
### 1. 주제1
- 세부 내용
- 세부 내용

### 2. 주제2
- 세부 내용
- 세부 내용

## 💡 중요 포인트
- 꼭 기억해야 할 핵심 개념
- 시험이나 과제에 나올 만한 내용
"""

        response = await self.llm.ainvoke(prompt)
        return response.content

    async def generate_progressive_report_async(
        self,
        transcript_chunk: str,
        previous_report: str | None = None,
        chunk_index: int = 0,
    ) -> str:
        """
        점진적 보고서 생성 (우측 패널용, 3~5분마다 갱신)

        새 STT 텍스트가 추가될 때마다 기존 보고서에 통합하여
        갱신된 보고서를 생성한다.

        Args:
            transcript_chunk: 마지막 보고서 이후 새로 축적된 텍스트
            previous_report: 이전 보고서 (첫 요청 시 None)
            chunk_index: 보고서 갱신 회차 (0부터)

        Returns:
            갱신된 보고서 텍스트
        """
        if previous_report:
            prompt = f"""당신은 대학 강의를 실시간으로 정리하는 AI 비서입니다.

## 지금까지의 보고서
{previous_report}

## 새로 추가된 강의 내용 (회차 {chunk_index + 1})
{transcript_chunk}

## 지시사항
위의 "지금까지의 보고서"에 새 내용을 통합하여 갱신된 보고서를 작성하세요.

다음 형식을 유지하세요:

# 강의 보고서

## 핵심 키워드
- 키워드1, 키워드2, ...

## 주요 내용
### 1. 주제1
- 세부 내용 (교수 설명, 예시 포함)

### 2. 주제2
- 세부 내용

## 중요 포인트
- 시험에 나올 만한 핵심 개념
- 꼭 기억해야 할 내용

규칙:
- 기존 보고서의 내용을 유지하면서 새 내용을 자연스럽게 통합하세요
- 교수의 설명과 예시를 빠뜨리지 마세요
- 주제가 새로 등장하면 새 섹션을 추가하세요
- 기존 주제에 대한 추가 설명이면 해당 섹션에 통합하세요"""
        else:
            prompt = f"""당신은 대학 강의를 실시간으로 정리하는 AI 비서입니다.

## 강의 내용 (첫 번째 구간)
{transcript_chunk}

## 지시사항
위 강의 내용을 보고서 형식으로 정리하세요.

다음 형식으로 작성하세요:

# 강의 보고서

## 핵심 키워드
- 키워드1, 키워드2, ...

## 주요 내용
### 1. 주제1
- 세부 내용 (교수 설명, 예시 포함)

## 중요 포인트
- 시험에 나올 만한 핵심 개념

규칙:
- 교수의 설명과 예시를 빠뜨리지 마세요
- 핵심 개념 중심으로 구조화하되 내용을 누락하지 마세요"""

        response = await self.llm.ainvoke(prompt)
        return response.content

