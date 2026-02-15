"use client"

import { Loader2, Sparkles } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReportPanelProps {
  currentReport: string
  chunkCount: number
  isGenerating: boolean
  className?: string
}

export function ReportPanel({
  currentReport,
  chunkCount,
  isGenerating,
  className,
}: ReportPanelProps) {
  const hasContent = currentReport.length > 0

  return (
    <div className={className ?? "w-full"}>
      <div className="rounded-lg border border-border bg-card">
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Sparkles className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-muted-foreground">
            AI 보고서
          </span>
          {isGenerating && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
          )}
          {chunkCount > 0 && !isGenerating && (
            <span className="text-xs text-muted-foreground ml-auto">
              {chunkCount}회 갱신
            </span>
          )}
        </div>

        {/* 보고서 내용 */}
        <ScrollArea className="h-64">
          <div className="p-4">
            {!hasContent && !isGenerating && (
              <p className="text-sm text-muted-foreground text-center py-8">
                STT 내용이 쌓이면 자동으로 보고서가 생성됩니다
              </p>
            )}

            {!hasContent && isGenerating && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  첫 번째 보고서를 생성하고 있습니다...
                </p>
              </div>
            )}

            {hasContent && (
              <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {currentReport}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
