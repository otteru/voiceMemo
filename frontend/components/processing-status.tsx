"use client"

import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProcessingStep = "idle" | "stt" | "ai" | "notion" | "complete"

interface ProcessingStatusProps {
  currentStep: ProcessingStep
}

const steps = [
  { id: "stt", label: "음성 텍스트 변환 중..." },
  { id: "ai", label: "AI 요약 생성 중..." },
  { id: "notion", label: "노션에 저장 중..." },
]

function getStepStatus(
  stepId: string,
  currentStep: ProcessingStep
): "pending" | "processing" | "complete" {
  const stepOrder = ["stt", "ai", "notion", "complete"]
  const currentIndex = stepOrder.indexOf(currentStep)
  const stepIndex = stepOrder.indexOf(stepId)

  if (currentStep === "idle") return "pending"
  if (stepIndex < currentIndex) return "complete"
  if (stepIndex === currentIndex) return "processing"
  return "pending"
}

export function ProcessingStatus({ currentStep }: ProcessingStatusProps) {
  if (currentStep === "idle") return null

  return (
    <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
      <h3 className="text-center text-lg font-semibold text-foreground">
        {currentStep === "complete" ? "처리 완료!" : "처리 중..."}
      </h3>
      <div className="space-y-3">
        {steps.map((step) => {
          const status = getStepStatus(step.id, currentStep)
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  status === "complete" && "bg-green-500",
                  status === "processing" && "bg-primary",
                  status === "pending" && "bg-muted"
                )}
              >
                {status === "complete" ? (
                  <Check className="h-4 w-4 text-white" />
                ) : status === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  status === "complete" && "text-green-400",
                  status === "processing" && "text-foreground",
                  status === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
