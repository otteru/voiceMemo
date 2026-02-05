"use client"

import { useState, useEffect, useCallback } from "react"
import { Mic, Sparkles, FileText } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { RecordButton } from "@/components/record-button"
import { FeatureCard } from "@/components/feature-card"
import { AudioWaveform } from "@/components/audio-waveform"
import { ProcessingStatus, type ProcessingStep } from "@/components/processing-status"
import { SummaryPreview } from "@/components/summary-preview"

type AppState = "idle" | "recording" | "processing" | "complete"

const MOCK_SUMMARY = `## 오늘 강의 요약

### 핵심 개념
- 머신러닝의 기본 원리와 지도학습/비지도학습의 차이점
- 신경망 구조와 역전파 알고리즘의 작동 방식
- 과적합 문제와 이를 해결하기 위한 정규화 기법

### 주요 내용
1. **지도학습**: 레이블이 있는 데이터를 사용하여 모델을 훈련
2. **비지도학습**: 레이블 없이 데이터의 패턴을 찾는 방식
3. **강화학습**: 보상을 통해 최적의 행동을 학습

### 다음 시간 예고
- CNN(합성곱 신경망)의 구조와 이미지 분류 적용
- 실습: MNIST 데이터셋을 활용한 손글씨 인식`

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle")
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle")
  const [recordingTime, setRecordingTime] = useState(0)
  const [isNotionConnected, setIsNotionConnected] = useState(false)

  // Check Notion connection status
  useEffect(() => {
    const notionToken = localStorage.getItem("notion_token")
    const notionDatabaseId = localStorage.getItem("notion_database_id")
    setIsNotionConnected(!!notionToken && !!notionDatabaseId)
  }, [])

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (appState === "recording") {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [appState])

  const simulateProcessing = useCallback(async () => {
    setAppState("processing")
    
    // STT step
    setProcessingStep("stt")
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    // AI step
    setProcessingStep("ai")
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    // Notion step
    setProcessingStep("notion")
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Complete
    setProcessingStep("complete")
    setAppState("complete")
  }, [])

  const handleRecordToggle = useCallback(async () => {
    try {
      if (appState === "idle") {
        // 마이크 권한 요청
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setAppState("recording")
        setRecordingTime(0)
        toast.success("녹음을 시작합니다")
      } else if (appState === "recording") {
        toast.info("녹음을 처리하고 있습니다...")
        await simulateProcessing()
      }
    } catch (error) {
      console.error("녹음 에러:", error)
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("마이크 접근 권한이 필요합니다")
      } else {
        toast.error("녹음 중 오류가 발생했습니다")
      }
    }
  }, [appState, simulateProcessing])

  const handleReset = useCallback(() => {
    setAppState("idle")
    setProcessingStep("idle")
    setRecordingTime(0)
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

          {appState === "complete" && (
            <div className="mb-16">
              <SummaryPreview
                summary={MOCK_SUMMARY}
                notionUrl="https://notion.so/example"
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
