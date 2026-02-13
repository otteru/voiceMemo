# 프로젝트 개요
## 페인포인트 
- 1) 대학생이 수업시간에 잠깐 딴 생각을 하다가 다시 수업을 봤을 때 수업 내용을 따라가기 어렵다.
- 2) 대학 특성상 교수의 말이 중요해서 그걸 잘 정리해놓는게 중요한데 수업 들으면서 정리하는 게 어렵다.

## 솔루션
- 수업을 하면 stt 진행 및 llm으로 보고서를 만들어줘서 notion이나 obsidian 과 같은 대학생들이 많이 사용하는 노트 앱으로 넣어준다.
(mvp는 notion으로만 하고 있는데 실제로는 조사 해봐야 한다.)

## 주의해야 하는 점
- 페인포인트1을 위해 한번에 정리해서 주는 것이 실시간으로 stt 및 정리가 되고 그걸 사용자가 확인할 수 있어야 한다.

### 실시간 정리
- stt를 websoket으로 streaming 형태로 사용
- 매번 llm을 호출하는 것은 비용적으로 부담 -> 일정 내용이 쌓이면 llm으로 정리



## 확장
- 수업 자료를 업로드하면 거기서 사진이나 글 가져와서 보고서 완성도를 높여주는 기능

# stt 모델 선정 참고 사이트

https://github.com/rtzr/Awesome-Korean-Speech-Recognition?tab=readme-ov-file#%ED%95%9C%EA%B5%AD%EC%96%B4-%EC%9D%8C%EC%84%B1%EC%9D%B8%EC%8B%9D-api

## return zero api 가이드

https://developers.rtzr.ai/docs/authentications/

# 노션 api 관련 

**공식 홈페이지**
https://developers.notion.com/reference/intro

**SDK**
공식적으로는 javascript SDK 와 cURL으로만 지원하기에 
https://github.com/ramnes/notion-sdk-py
커뮤니티에서 만든 sdk 사용

사용자가 입력해야 하는 것 
1. notion 토큰
2. notion 위치 url

## 위치

사용자가 url로 입력하게 하고 거기에 그냥 적어주는게 일단은 베스트일 듯 
물론 데이터베이스 만들어주고 할 수 있지만 그게 오히려 자율성을 해칠 수 있어서 그건 나중에 option으로 넣어야 할 듯

## 1차 MVP

기능 - 실시간으로 강의 정리되는게 노션에 나와야 함
디자인 - 신경 x

