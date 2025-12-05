"use client"

import { cn } from "@/lib/utils"
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EpsilonBadgeProps {
  epsilon?: number | null
  delta?: number | null
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

function getPrivacyLevel(epsilon: number): {
  level: "strong" | "moderate" | "weak" | "none"
  label: string
  description: string
} {
  if (epsilon <= 1) {
    return {
      level: "strong",
      label: "Strong Privacy",
      description: "Very strong privacy guarantees. Individual records are well protected.",
    }
  } else if (epsilon <= 10) {
    return {
      level: "moderate",
      label: "Moderate Privacy",
      description: "Good privacy-utility trade-off. Suitable for most use cases.",
    }
  } else if (epsilon <= 100) {
    return {
      level: "weak",
      label: "Weak Privacy",
      description: "Privacy budget is high. Consider lower epsilon for sensitive data.",
    }
  } else {
    return {
      level: "none",
      label: "Minimal Privacy",
      description: "Very high epsilon provides minimal differential privacy protection.",
    }
  }
}

export function EpsilonBadge({ epsilon, delta, size = "md", showLabel = true, className }: EpsilonBadgeProps) {
  if (epsilon === null || epsilon === undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
                "bg-muted/50 text-muted-foreground border-border",
                size === "sm" && "text-xs px-1.5 py-0.5",
                size === "lg" && "text-base px-3 py-1",
                className,
              )}
            >
              <ShieldQuestion className={cn("h-3.5 w-3.5", size === "sm" && "h-3 w-3", size === "lg" && "h-4 w-4")} />
              {showLabel && <span className="font-medium">No DP</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">No differential privacy applied</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const { level, label, description } = getPrivacyLevel(epsilon)

  const Icon = level === "strong" ? ShieldCheck : level === "moderate" ? Shield : ShieldAlert

  const colorClasses = {
    strong: "bg-success/10 text-success border-success/30",
    moderate: "bg-primary/10 text-primary border-primary/30",
    weak: "bg-warning/10 text-warning-foreground border-warning/30",
    none: "bg-risk/10 text-risk border-risk/30",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-smooth",
              colorClasses[level],
              size === "sm" && "text-xs px-1.5 py-0.5",
              size === "lg" && "text-base px-3 py-1",
              className,
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", size === "sm" && "h-3 w-3", size === "lg" && "h-4 w-4")} />
            <span className="font-mono font-medium">ε={epsilon.toFixed(1)}</span>
            {showLabel && <span className="text-xs opacity-75">({label})</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {delta && <p className="text-xs font-mono text-muted-foreground">δ = {delta.toExponential(1)}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
