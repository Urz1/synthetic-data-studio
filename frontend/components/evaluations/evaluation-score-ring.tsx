"use client"

import { cn } from "@/lib/utils"

interface EvaluationScoreRingProps {
  score: number
  label: string
  size?: "sm" | "md" | "lg"
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 0.85) return "text-success"
  if (score >= 0.7) return "text-primary"
  if (score >= 0.5) return "text-warning-foreground"
  return "text-risk"
}

function getScoreTrackColor(score: number): string {
  if (score >= 0.85) return "stroke-success"
  if (score >= 0.7) return "stroke-primary"
  if (score >= 0.5) return "stroke-warning"
  return "stroke-risk"
}

export function EvaluationScoreRing({ score, label, size = "md", className }: EvaluationScoreRingProps) {
  const sizeConfig = {
    sm: { width: 60, strokeWidth: 4, textSize: "text-sm", labelSize: "text-[10px]" },
    md: { width: 80, strokeWidth: 5, textSize: "text-xl", labelSize: "text-xs" },
    lg: { width: 120, strokeWidth: 6, textSize: "text-3xl", labelSize: "text-sm" },
  }

  const config = sizeConfig[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - score * circumference

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg className="transform -rotate-90" width={config.width} height={config.width}>
          {/* Background track */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted"
          />
          {/* Progress track */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-700 ease-out", getScoreTrackColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums", config.textSize, getScoreColor(score))}>
            {Math.round(score * 100)}
          </span>
        </div>
      </div>
      <span className={cn("text-muted-foreground font-medium", config.labelSize)}>{label}</span>
    </div>
  )
}
