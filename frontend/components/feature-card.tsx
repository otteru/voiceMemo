import React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  title: string
  description: string
}

export const FeatureCard = React.memo(function FeatureCard({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:bg-card/80">
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
          iconBgColor
        )}
      >
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
})
