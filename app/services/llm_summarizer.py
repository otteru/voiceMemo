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
