"use client"

import { useState, useRef, useCallback } from "react"
import { WS_BASE_URL } from "@/lib/api"

const SAMPLE_RATE = 16000

/** 전사 세그먼트 (final 확정된 결과) */
export interface TranscriptSegment {
  seq: number
  text: string
  startAt: number
  duration: number
}

/** 스트리밍 상태 */
export type StreamingState =
  | "idle"
  | "connecting"
  | "streaming"
  | "stopping"
  | "error"

/** 서버 메시지 타입 */
interface STTResultMessage {
  type: "stt_result"
  seq: number
  final: boolean
  text: string
  start_at: number
  duration: number
}

interface STTErrorMessage {
  type: "error"
  message: string
}

interface STTEosAckMessage {
  type: "eos_ack"
}

type ServerMessage = STTResultMessage | STTErrorMessage | STTEosAckMessage

export function useStreamingSTT() {
  const [state, setState] = useState<StreamingState>("idle")
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [interimText, setInterimText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /** final 세그먼트의 전체 텍스트 */
  const finalText = segments.map((s) => s.text).join(" ")

  const cleanup = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
      wsRef.current = null
    }
  }, [])

  const startStreaming = useCallback(async () => {
    try {
      setState("connecting")
      setError(null)
      setSegments([])
      setInterimText("")

      // 1. 마이크 접근
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      // 2. AudioContext + AudioWorklet
      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioContextRef.current = audioContext

      await audioContext.audioWorklet.addModule("/audio-worklet-processor.js")

      const source = audioContext.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor")
      workletNodeRef.current = workletNode

      // 3. WebSocket 연결
      const ws = new WebSocket(`${WS_BASE_URL}/ws/stt`)
      wsRef.current = ws

      ws.onopen = () => {
        // 실제 sampleRate를 config으로 전송 (브라우저가 요청한 값과 다를 수 있음)
        ws.send(
          JSON.stringify({
            type: "config",
            sample_rate: audioContext.sampleRate,
            encoding: "LINEAR16",
          })
        )

        // AudioWorklet 연결 시작
        source.connect(workletNode)
        // destination에 연결하지 않음 (스피커 출력 방지)

        setState("streaming")
      }

      // AudioWorklet → WebSocket
      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(event.data)
        }
      }

      // STT 결과 수신
      ws.onmessage = (event: MessageEvent) => {
        const data: ServerMessage = JSON.parse(event.data)

        if (data.type === "stt_result") {
          if (data.final) {
            setSegments((prev) => [
              ...prev,
              {
                seq: data.seq,
                text: data.text,
                startAt: data.start_at,
                duration: data.duration,
              },
            ])
            setInterimText("")
          } else {
            setInterimText(data.text)
          }
        } else if (data.type === "error") {
          setError(data.message)
          setState("error")
          cleanup()
        } else if (data.type === "eos_ack") {
          setState("idle")
        }
      }

      ws.onerror = () => {
        setError("WebSocket 연결 오류가 발생했습니다")
        setState("error")
        cleanup()
      }

      ws.onclose = (event) => {
        if (!event.wasClean && wsRef.current) {
          setError("서버 연결이 끊어졌습니다")
          setState("error")
        }
        cleanup()
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "마이크 접근 권한이 필요합니다"
          : "스트리밍 시작 중 오류가 발생했습니다"
      setError(message)
      setState("error")
      cleanup()
    }
  }, [cleanup])

  const stopStreaming = useCallback(() => {
    setState("stopping")

    // 오디오 수집 중지
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // EOS 전송 → 서버가 잔여 결과 처리 후 eos_ack 응답
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "eos" }))
    } else {
      setState("idle")
    }
  }, [])

  const resetStreaming = useCallback(() => {
    cleanup()
    setState("idle")
    setSegments([])
    setInterimText("")
    setError(null)
  }, [cleanup])

  return {
    state,
    segments,
    interimText,
    finalText,
    startStreaming,
    stopStreaming,
    resetStreaming,
    error,
  }
}
