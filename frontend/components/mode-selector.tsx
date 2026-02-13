"use client"

import { Mic, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export type RecordingMode = "realtime" | "upload"

interface ModeSelectorProps {
  mode: RecordingMode
  onModeChange: (mode: RecordingMode) => void
  disabled: boolean
}

export function ModeSelector({ mode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-1">
      <button
        onClick={() => onModeChange("realtime")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
          mode === "realtime"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Mic className="h-4 w-4" />
        실시간
      </button>
      <button
        onClick={() => onModeChange("upload")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
          mode === "upload"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-4 w-4" />
        파일 업로드
      </button>
    </div>
  )
}
