"use client"

import { useState, useRef, useCallback } from "react"
import { reportApi } from "@/lib/api"
import type { TranscriptSegment } from "@/hooks/use-streaming-stt"
import type { ReportChunk } from "@/types"

export function useProgressiveReport() {
  const [currentReport, setCurrentReport] = useState("")
  const [reportChunks, setReportChunks] = useState<ReportChunk[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastReportedIndexRef = useRef(0)

  const triggerReport = useCallback(
    async (allSegments: TranscriptSegment[]): Promise<boolean> => {
      if (allSegments.length <= lastReportedIndexRef.current) {
        return false
      }
      if (isGenerating) {
        return false
      }

      const newSegments = allSegments.slice(lastReportedIndexRef.current)
      const newText = newSegments.map((s) => s.text).join(" ")

      if (newText.trim().length < 50) {
        return false
      }

      setIsGenerating(true)
      setError(null)

      try {
        const response = await reportApi.progressive({
          transcriptChunk: newText,
          previousReport: currentReport || null,
          chunkIndex: reportChunks.length,
        })

        setCurrentReport(response.report)
        setReportChunks((prev) => [
          ...prev,
          {
            index: response.chunkIndex,
            report: response.report,
            timestamp: Date.now(),
          },
        ])
        lastReportedIndexRef.current = allSegments.length
        return true
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "보고서 생성에 실패했습니다"
        setError(message)
        return false
      } finally {
        setIsGenerating(false)
      }
    },
    [currentReport, reportChunks.length, isGenerating]
  )

  const resetReport = useCallback(() => {
    setCurrentReport("")
    setReportChunks([])
    setIsGenerating(false)
    setError(null)
    lastReportedIndexRef.current = 0
  }, [])

  return {
    currentReport,
    reportChunks,
    isGenerating,
    error,
    triggerReport,
    resetReport,
  }
}
