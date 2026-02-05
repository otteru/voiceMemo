"use client"

import { ExternalLink, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SummaryPreviewProps {
  summary: string
  notionUrl?: string
  onReset: () => void
}

export function SummaryPreview({ summary, notionUrl, onReset }: SummaryPreviewProps) {
  return (
    <div className="w-full max-w-2xl space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">강의 요약</h3>
        <p className="text-sm text-muted-foreground">
          AI가 정리한 강의 내용입니다
        </p>
      </div>
      
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {summary}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {notionUrl && (
          <Button
            asChild
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href={notionUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              노션에서 보기
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1 border-border bg-transparent text-foreground hover:bg-muted"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          다시 녹음하기
        </Button>
      </div>
    </div>
  )
}
