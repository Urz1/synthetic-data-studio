"use client"

import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface DimensionCardProps {
  icon: ReactNode
  title: string
  score: number // 0-100
  trend?: number // e.g., +2.4, -1.2, 0
  trendLabel?: string // e.g., "Stable"
  color: string // Tailwind color class like "text-primary"
  barColor: string // Hex color for progress bar
}

export function DimensionCard({
  icon,
  title,
  score,
  trend,
  trendLabel,
  color,
  barColor,
}: DimensionCardProps) {
  const getTrendIcon = () => {
    if (trendLabel) {
      return <Minus className="h-3 w-3" />
    }
    if (trend === undefined || trend === 0) return null
    if (trend > 0) return <TrendingUp className="h-3 w-3" />
    return <TrendingDown className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (trendLabel) return "text-muted-foreground"
    if (trend === undefined || trend === 0) return "text-muted-foreground"
    if (trend > 0) return "text-success"
    return "text-risk"
  }

  const getTrendText = () => {
    if (trendLabel) return trendLabel
    if (trend === undefined || trend === 0) return null
    return `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`
  }

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        {/* Header with icon and trend */}
        <div className="flex items-start justify-between mb-3">
          <span className={`${color}`}>{icon}</span>
          {(trend !== undefined || trendLabel) && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{getTrendText()}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>

        {/* Score */}
        <p className="text-2xl font-bold text-foreground">
          {score.toFixed(0)}%
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(score, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
