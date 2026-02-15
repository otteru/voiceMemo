"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TranscriptSegment } from "@/hooks/use-streaming-stt"

interface LiveTranscriptProps {
  segments: TranscriptSegment[]
  interimText: string
  isStreaming: boolean
  className?: string
}

export function LiveTranscript({ segments, interimText, isStreaming, className }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // 새 텍스트가 추가될 때 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [segments, interimText])

  const hasContent = segments.length > 0 || interimText

  return (
    <div className={className ?? "w-full max-w-2xl mx-auto"}>
      <div className="rounded-lg border border-border bg-card">
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {isStreaming && (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {isStreaming ? "실시간 전사 중..." : "전사 결과"}
          </span>
        </div>

        {/* 전사 내용 */}
        <ScrollArea className="h-64">
          <div className="p-4 space-y-1">
            {!hasContent && (
              <p className="text-sm text-muted-foreground text-center py-8">
                음성이 인식되면 여기에 표시됩니다
              </p>
            )}

            {/* 확정된 세그먼트 */}
            {segments.map((segment) => (
              <span key={segment.seq} className="text-sm text-foreground">
                {segment.text}{" "}
              </span>
            ))}

            {/* 진행 중 텍스트 (이탤릭) */}
            {interimText && (
              <span className="text-sm text-muted-foreground italic">
                {interimText}
              </span>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
