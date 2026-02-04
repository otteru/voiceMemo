# stt 모델 선정 참고 사이트

https://github.com/rtzr/Awesome-Korean-Speech-Recognition?tab=readme-ov-file#%ED%95%9C%EA%B5%AD%EC%96%B4-%EC%9D%8C%EC%84%B1%EC%9D%B8%EC%8B%9D-api

## return zero api 가이드

https://developers.rtzr.ai/docs/authentications/

실행 방법
1. 테스트용 오디오 파일 준비
프로젝트 폴더에 test_audio.wav 파일을 넣어주세요.

지원 형식: wav, mp3, m4a, flac 등
다른 파일명 사용 시 test_stt.py:17에서 경로 수정
2. 패키지 설치

pip install -r requirements.txt
3. 실행

python test_stt.py
4. 결과 확인
콘솔에 실시간으로 변환 텍스트 출력
output.txt 파일에 최종 결과 저장
주의사항
sample_rate 조정: 오디오 파일의 샘플링 레이트에 맞춰야 합니다.

일반 녹음: 16000 Hz (기본값)
고품질: 44100 Hz 또는 48000 Hz
파일 속성 확인 방법:


ffprobe test_audio.wav
테스트할 오디오 파일 있으면 바로 실행해보세요!