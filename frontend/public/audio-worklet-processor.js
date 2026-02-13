/**
 * AudioWorklet Processor
 * 마이크 오디오를 Int16 PCM으로 변환하여 메인 스레드로 전송
 *
 * process()는 128 샘플(프레임) 단위로 호출됨
 * 16kHz에서 128 샘플 = 8ms → 너무 잦은 전송 방지를 위해
 * 내부 버퍼에 모아서 ~100ms(1600 샘플) 단위로 전송
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = new Float32Array(0)
    this._bufferSize = 1600 // 16kHz * 0.1s = 1600 samples
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true

    const channelData = input[0] // 모노 채널
    if (!channelData) return true

    // 기존 버퍼에 새 샘플 추가
    const newBuffer = new Float32Array(this._buffer.length + channelData.length)
    newBuffer.set(this._buffer)
    newBuffer.set(channelData, this._buffer.length)
    this._buffer = newBuffer

    // 버퍼가 목표 크기에 도달하면 전송
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.slice(0, this._bufferSize)
      this._buffer = this._buffer.slice(this._bufferSize)

      // Float32 (-1.0 ~ 1.0) → Int16 (-32768 ~ 32767)
      const int16Array = new Int16Array(chunk.length)
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]))
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }

      this.port.postMessage(int16Array.buffer, [int16Array.buffer])
    }

    return true
  }
}

registerProcessor("pcm-processor", PCMProcessor)
