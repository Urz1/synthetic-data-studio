"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

interface RiskIndicatorProps {
  level: "low" | "medium" | "high"
  score?: number
  label?: string
  size?: "sm" | "md" | "lg"
  showScore?: boolean
  className?: string
}

export function RiskIndicator({ level, score, label, size = "md", showScore = true, className }: RiskIndicatorProps) {
  const config = {
    low: {
      icon: CheckCircle2,
      label: "Low Risk",
      bgClass: "bg-success/10",
      textClass: "text-success",
      borderClass: "border-success/30",
      barClass: "bg-success",
    },
    medium: {
      icon: AlertTriangle,
      label: "Medium Risk",
      bgClass: "bg-warning/10",
      textClass: "text-warning-foreground",
      borderClass: "border-warning/30",
      barClass: "bg-warning",
    },
    high: {
      icon: XCircle,
      label: "High Risk",
      bgClass: "bg-risk/10",
      textClass: "text-risk",
      borderClass: "border-risk/30",
      barClass: "bg-risk",
    },
  }

  const { icon: Icon, label: defaultLabel, bgClass, textClass, borderClass, barClass } = config[level]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2",
        bgClass,
        borderClass,
        size === "sm" && "px-2 py-1 gap-1.5",
        size === "lg" && "px-4 py-3 gap-3",
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", textClass, size === "sm" && "h-3.5 w-3.5", size === "lg" && "h-5 w-5")} />
      <div className="flex flex-col gap-0.5">
        <span className={cn("font-medium", textClass, size === "sm" && "text-sm")}>{label || defaultLabel}</span>
        {showScore && score !== undefined && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barClass)}
                style={{ width: `${Math.min(score * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">{(score * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
