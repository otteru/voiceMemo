# STT 모델 선정 

## 중요하게 보는 점
- stt 퀄리티 (한국어, 영어)
- websoket 실시간 스트리밍 가능
- 비용

## 모델

### ReturnZero STT

stt 퀄리티 : 유튜브로 테스트를 했을 때 마냥 좋지만은 않음
websocket 실시간 스트리밍 : 지원
비용 :
    구간	월 사용량 (시간)	시간당 요금 (원)
    T1	0 ≤ 사용량 ≤ 1,000시간	1,000
    T2	1,000 < 사용량 ≤ 10,000시간	500
    T3	10,000 < 사용량 ≤ 25,000시간	400
    T4	25,000시간 초과	300

### OpenAI Realtime Whisper

stt 퀄리티 : returnzero 보다 훨씬 낫다
websoket 실시간 스트리밍 : 
비용 : gpt‑4o‑transcribe, whisper-1 기준 분당 $0.006, 
    시간 당 $0.36 -> 540원 (환율 1500원 기준)

https://developers.openai.com/api/docs/guides/realtime-websocket?connection-example=python
https://developers.openai.com/api/docs/guides/realtime-transcription
https://developers.openai.com/api/docs/pricing/

### Naver Clova Speech

비용 : 스트리밍 기준 15초 당 5원 -> 분당 20원 -> 시간 당 1200원
https://api.ncloud-docs.com/docs/ai-application-service-clovaspeech-grpc
https://www.ncloud.com/v2/product/aiService/clovaSpeech#pricing