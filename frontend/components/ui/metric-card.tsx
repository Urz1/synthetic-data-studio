"use client"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label?: string
    direction: "up" | "down" | "neutral"
  }
  icon?: ReactNode
  tooltip?: string
  quality?: "good" | "neutral" | "poor"
  sparkline?: number[]
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  tooltip,
  quality = "neutral",
  sparkline,
  className,
}: MetricCardProps) {
  const qualityConfig = {
    good: {
      accent: "bg-success/10 text-success",
      border: "border-success/20",
      sparkline: "stroke-success",
    },
    neutral: {
      accent: "bg-primary/10 text-primary",
      border: "border-primary/20",
      sparkline: "stroke-primary",
    },
    poor: {
      accent: "bg-risk/10 text-risk",
      border: "border-risk/20",
      sparkline: "stroke-risk",
    },
  }

  const trendConfig = {
    up: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    down: { icon: TrendingDown, color: "text-risk", bg: "bg-risk/10" },
    neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
  }

  const config = qualityConfig[quality]
  const TrendIcon = trend ? trendConfig[trend.direction].icon : null

  return (
    <Card className={cn("relative overflow-hidden transition-all duration-200 hover:shadow-md", className)}>
      {/* Subtle accent indicator */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.accent.split(" ")[0])} />

      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground truncate">{title}</span>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/40 cursor-help shrink-0 hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Value row */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1",
                    trendConfig[trend.direction].bg,
                    trendConfig[trend.direction].color,
                  )}
                >
                  {TrendIcon && <TrendIcon className="h-3 w-3" />}
                  <span>
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}%
                  </span>
                </div>
              )}
            </div>

            {/* Subtitle */}
            {(subtitle || trend?.label) && <p className="text-xs text-muted-foreground">{subtitle || trend?.label}</p>}
          </div>

          {/* Icon or Sparkline */}
          <div className="shrink-0">
            {sparkline && sparkline.length > 0 ? (
              <Sparkline data={sparkline} className={config.sparkline} />
            ) : icon ? (
              <div className={cn("p-2.5 rounded-xl", config.accent)}>{icon}</div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mini sparkline component
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const width = 64
  const height = 32
  const padding = 2

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = padding + (1 - (value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-all", className)}
      />
      {/* End dot */}
      <circle
        cx={padding + (width - padding * 2)}
        cy={padding + (1 - (data[data.length - 1] - min) / range) * (height - padding * 2)}
        r={3}
        className={cn("fill-current", className?.replace("stroke-", "text-"))}
      />
    </svg>
  )
}
