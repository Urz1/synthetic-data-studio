"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DESIGN_TOKENS } from "@/lib/design-tokens"

interface AutoSaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error"
  className?: string
}

/**
 * AutoSave Indicator Component
 * - Shows "Saving..." → "Saved" states
 * - Discreet checkmark animation
 * - Fades out after 2s when saved
 */
export function AutoSaveIndicator({ status, className }: AutoSaveIndicatorProps) {
  const [shouldShow, setShouldShow] = React.useState(false)

  React.useEffect(() => {
    if (status === "saving") {
      setShouldShow(true)
    } else if (status === "saved") {
      setShouldShow(true)
      // Fade out after 2 seconds
      const timer = setTimeout(() => {
        setShouldShow(false)
      }, 2000)
      return () => clearTimeout(timer)
    } else if (status === "error") {
      setShouldShow(true)
    } else {
      setShouldShow(false)
    }
  }, [status])

  if (!shouldShow && status === "idle") return null

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-opacity",
        !shouldShow && "opacity-0",
        className
      )}
      style={{
        transitionDuration: `${DESIGN_TOKENS.animation.duration.normal}ms`,
        transitionTimingFunction: DESIGN_TOKENS.animation.easing.standard,
      }}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check 
            className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
            style={{
              animation: `checkmark ${DESIGN_TOKENS.animation.duration.normal}ms ${DESIGN_TOKENS.animation.easing.standard}`,
            }}
          />
          <span className="text-green-600 dark:text-green-400">Saved</span>
        </>
      )}
      {status === "error" && (
        <span className="text-red-600 dark:text-red-400">Failed to save</span>
      )}
    </div>
  )
}
