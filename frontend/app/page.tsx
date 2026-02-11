"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Mic, Sparkles, FileText } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { RecordButton } from "@/components/record-button"
import { FeatureCard } from "@/components/feature-card"
import { AudioWaveform } from "@/components/audio-waveform"
import { ProcessingStatus, type ProcessingStep } from "@/components/processing-status"
import { SummaryPreview } from "@/components/summary-preview"
import { recordingsApi, notionApi } from "@/lib/api"
import type { Recording } from "@/types"

type AppState = "idle" | "recording" | "processing" | "complete"

const POLL_INTERVAL = 2000

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle")
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle")
  const [recordingTime, setRecordingTime] = useState(0)
  const [isNotionConnected, setIsNotionConnected] = useState(false)
  const [completedRecording, setCompletedRecording] = useState<Recording | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Backend 세션에서 Notion 연결 상태 확인
  useEffect(() => {
    notionApi.checkConnection()
      .then(({ connected }) => setIsNotionConnected(connected))
      .catch(() => setIsNotionConnected(false))
  }, [])

  // 녹음 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (appState === "recording") {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [appState])

  // 녹음 시작
  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    audioChunksRef.current = []

    // Return Zero 지원 형식으로 직접 녹음 시도
    const preferredMimeTypes = [
      'audio/ogg;codecs=opus',  // Ogg Opus (최우선)
      'audio/webm;codecs=opus', // WebM Opus (대체)
      'audio/webm',             // WebM (기본)
    ]

    let selectedMimeType = ''
    for (const mimeType of preferredMimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType
        console.log(`✅ 지원되는 형식: ${mimeType}`)
        break
      }
    }

    const mediaRecorder = selectedMimeType
      ? new MediaRecorder(stream, { mimeType: selectedMimeType })
      : new MediaRecorder(stream)
    
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.start()
    setAppState("recording")
    setRecordingTime(0)
    toast.success("녹음을 시작합니다")
  }, [])

  // 녹음 중지 → Blob 반환
  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      if (!mediaRecorder) {
        resolve(new Blob())
        return
      }

      mediaRecorder.onstop = () => {
        // 녹음 시 사용한 MIME 타입 그대로 사용
        const mimeType = mediaRecorder.mimeType || "audio/webm"
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log(`📦 Blob 생성 완료: ${mimeType}, ${audioBlob.size} bytes`)
        
        // 마이크 스트림 해제
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }, [])

  // 상태 폴링으로 백그라운드 처리 추적
  const pollStatus = useCallback(async (recordingId: string): Promise<Recording> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const { status } = await recordingsApi.getStatus(recordingId)

          // Backend 상태에 따라 processingStep 업데이트
          if (status === "stt") {
            setProcessingStep("stt")
          } else if (status === "ai") {
            setProcessingStep("ai")
          } else if (status === "complete") {
            setProcessingStep("complete")
            const recording = await recordingsApi.get(recordingId)
            resolve(recording)
            return
          } else if (status === "idle") {
            // 에러로 롤백된 경우
            reject(new Error("처리 중 오류가 발생했습니다"))
            return
          }

          setTimeout(poll, POLL_INTERVAL)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }, [])

  // 녹음 완료 후 처리
  const processRecording = useCallback(async (audioBlob: Blob) => {
    setAppState("processing")
    setProcessingStep("stt")

    try {
      // 1. 오디오 업로드
      const { id } = await recordingsApi.create({
        audioBlob,
        title: `강의 녹음 ${new Date().toLocaleDateString("ko-KR")}`,
      })

      // 2. 상태 폴링으로 처리 완료 대기
      const recording = await pollStatus(id)

      // 3. Notion 연결 시 자동 저장
      if (isNotionConnected && recording.summary) {
        setProcessingStep("notion")
        try {
          const { url } = await notionApi.save({
            recordingId: recording.id,
            summary: recording.summary,
            title: recording.title,
          })
          recording.notionUrl = url
          toast.success("노션에 저장되었습니다")
        } catch {
          toast.error("노션 저장에 실패했습니다. 수동으로 저장해주세요")
        }
      }

      // 4. 완료
      setCompletedRecording(recording)
      setAppState("complete")
      toast.success("강의 정리가 완료되었습니다")
    } catch (error) {
      const message = error instanceof Error ? error.message : "처리 중 오류가 발생했습니다"
      toast.error(message)
      setAppState("idle")
      setProcessingStep("idle")
    }
  }, [pollStatus, isNotionConnected])

  const handleRecordToggle = useCallback(async () => {
    try {
      if (appState === "idle") {
        await startRecording()
      } else if (appState === "recording") {
        toast.info("녹음을 처리하고 있습니다...")
        const audioBlob = await stopRecording()
        await processRecording(audioBlob)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("마이크 접근 권한이 필요합니다")
      } else {
        toast.error("녹음 중 오류가 발생했습니다")
      }
    }
  }, [appState, startRecording, stopRecording, processRecording])

  const handleReset = useCallback(() => {
    setAppState("idle")
    setProcessingStep("idle")
    setRecordingTime(0)
    setCompletedRecording(null)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const features = [
    {
      icon: Mic,
      iconColor: "text-primary",
      iconBgColor: "bg-primary/20",
      title: "실시간 음성 인식",
      description: "고정밀 STT 기술로 강의 내용을 정확하게 텍스트로 변환",
    },
    {
      icon: Sparkles,
      iconColor: "text-green-400",
      iconBgColor: "bg-green-500/20",
      title: "AI 자동 요약",
      description: "핵심 내용만 추출하여 체계적으로 정리",
    },
    {
      icon: FileText,
      iconColor: "text-primary",
      iconBgColor: "bg-primary/20",
      title: "노션 자동 저장",
      description: "정리된 내용을 노션에 자동으로 저장하고 관리",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header isNotionConnected={isNotionConnected} />

      <main className="container mx-auto px-4 py-12">
        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <span className={`h-2 w-2 rounded-full ${appState === "recording" ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
            <span className="text-sm text-muted-foreground">
              {appState === "idle" && "대기 중"}
              {appState === "recording" && `녹음 중 - ${formatTime(recordingTime)}`}
              {appState === "processing" && "처리 중"}
              {appState === "complete" && "완료"}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center text-center">
          {appState === "idle" && (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
                강의를 녹음할 준비가 되었습니다
              </h1>
              <p className="text-muted-foreground mb-12 max-w-md">
                녹음 버튼을 누르면 자동으로 강의가 기록되고 AI가 정리해드립니다
              </p>
            </>
          )}

          {appState === "recording" && (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                녹음 중입니다
              </h1>
              <p className="text-muted-foreground mb-8">
                강의가 끝나면 녹음 버튼을 눌러 종료하세요
              </p>
              <div className="w-full max-w-md mb-8">
                <AudioWaveform isActive={true} />
              </div>
            </>
          )}

          {appState === "processing" && (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                강의를 정리하고 있습니다
              </h1>
              <p className="text-muted-foreground mb-8">
                잠시만 기다려 주세요
              </p>
            </>
          )}

          {appState === "complete" && (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                강의 정리가 완료되었습니다
              </h1>
              <p className="text-muted-foreground mb-8">
                아래에서 요약 내용을 확인하세요
              </p>
            </>
          )}

          {/* Recording Button or Processing Status */}
          {(appState === "idle" || appState === "recording") && (
            <div className="mb-16">
              <RecordButton
                isRecording={appState === "recording"}
                onClick={handleRecordToggle}
              />
            </div>
          )}

          {appState === "processing" && (
            <div className="mb-16">
              <ProcessingStatus currentStep={processingStep} />
            </div>
          )}

          {appState === "complete" && completedRecording && (
            <div className="mb-16">
              <SummaryPreview
                summary={completedRecording.summary || "요약을 생성하지 못했습니다"}
                notionUrl={completedRecording.notionUrl || ""}
                onReset={handleReset}
              />
            </div>
          )}
        </div>

        {/* Feature Cards */}
        {appState === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
