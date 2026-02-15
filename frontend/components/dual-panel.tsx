"use client"

import { LiveTranscript } from "@/components/live-transcript"
import { ReportPanel } from "@/components/report-panel"
import type { TranscriptSegment } from "@/hooks/use-streaming-stt"

interface DualPanelProps {
  segments: TranscriptSegment[]
  interimText: string
  isStreaming: boolean
  currentReport: string
  reportChunkCount: number
  isGenerating: boolean
}

export function DualPanel({
  segments,
  interimText,
  isStreaming,
  currentReport,
  reportChunkCount,
  isGenerating,
}: DualPanelProps) {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 데스크톱: 좌우 분할 */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4">
        <LiveTranscript
          segments={segments}
          interimText={interimText}
          isStreaming={isStreaming}
          className="w-full"
        />
        <ReportPanel
          currentReport={currentReport}
          chunkCount={reportChunkCount}
          isGenerating={isGenerating}
        />
      </div>

      {/* 모바일: 세로 배치 */}
      <div className="md:hidden space-y-4">
        <LiveTranscript
          segments={segments}
          interimText={interimText}
          isStreaming={isStreaming}
          className="w-full"
        />
        <ReportPanel
          currentReport={currentReport}
          chunkCount={reportChunkCount}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  )
}
