"use client"

import { Mic, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecordButtonProps {
  isRecording: boolean
  onClick: () => void
}

export function RecordButton({ isRecording, onClick }: RecordButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-44 w-44 flex-col items-center justify-center rounded-full transition-all duration-300",
        isRecording
          ? "bg-red-500 hover:bg-red-600"
          : "bg-primary hover:bg-primary/90"
      )}
    >
      {/* Outer glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full opacity-30 blur-xl transition-all duration-300",
          isRecording ? "bg-red-500" : "bg-primary"
        )}
      />
      
      {/* Pulsing ring animation when recording */}
      {isRecording && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-20" />
          <span className="absolute inset-[-8px] animate-pulse rounded-full border-2 border-red-500/50" />
        </>
      )}
      
      {/* Icon */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {isRecording ? (
          <Square className="h-10 w-10 text-white fill-white" />
        ) : (
          <Mic className="h-10 w-10 text-white" />
        )}
        <span className="text-lg font-medium text-white">
          {isRecording ? "녹음 중지" : "녹음 시작"}
        </span>
      </div>
    </button>
  )
}
