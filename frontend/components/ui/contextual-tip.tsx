"use client"

import * as React from "react"
import { X, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DESIGN_TOKENS } from "@/lib/design-tokens"

interface ContextualTipProps {
  id: string // Unique ID for localStorage persistence
  children: React.ReactNode
  variant?: "info" | "success" | "warning"
  className?: string
}

/**
 * Contextual Tip Component
 * - One tip per page
 * - Inline, dismissible
 * - Persists dismissal in localStorage
 * - Teaches power features in context
 */
export function ContextualTip({ 
  id, 
  children, 
  variant = "info",
  className 
}: ContextualTipProps) {
  const storageKey = `tip-dismissed-${id}`
  const [isDismissed, setIsDismissed] = React.useState(false)

  React.useEffect(() => {
    const dismissed = localStorage.getItem(storageKey)
    if (dismissed === "true") {
      setIsDismissed(true)
    }
  }, [storageKey])

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true")
    setIsDismissed(true)
  }

  if (isDismissed) return null

  const variantStyles = {
    info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  }

  const iconColors = {
    info: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
  }

  return (
    <div
      className={cn(
        "relative flex gap-3 rounded-lg border p-4 transition-all",
        variantStyles[variant],
        className
      )}
      style={{
        transitionDuration: `${DESIGN_TOKENS.animation.duration.normal}ms`,
        transitionTimingFunction: DESIGN_TOKENS.animation.easing.standard,
      }}
    >
      <Lightbulb className={cn("h-5 w-5 shrink-0 mt-0.5", iconColors[variant])} />
      <div className="flex-1 text-sm">{children}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="h-6 w-6 shrink-0 -mt-1 -mr-1 hover:bg-transparent"
        style={{
          minHeight: `${DESIGN_TOKENS.interaction.minTouchTarget}px`,
          minWidth: `${DESIGN_TOKENS.interaction.minTouchTarget}px`,
        }}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss tip</span>
      </Button>
    </div>
  )
}
