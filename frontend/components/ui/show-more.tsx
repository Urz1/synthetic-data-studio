"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DESIGN_TOKENS } from "@/lib/design-tokens"

interface ShowMoreProps {
  children: React.ReactNode
  label?: string
  defaultOpen?: boolean
  className?: string
}

/**
 * Progressive disclosure component
 * Hides advanced features behind explicit "Show More" toggle
 */
export function ShowMore({ 
  children, 
  label = "Show Advanced Options",
  defaultOpen = false,
  className 
}: ShowMoreProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-muted-foreground hover:text-foreground mb-4"
        style={{
          minHeight: `${DESIGN_TOKENS.interaction.minTouchTarget}px`,
          minWidth: `${DESIGN_TOKENS.interaction.minTouchTarget}px`,
        }}
      >
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
          style={{
            transitionDuration: `${DESIGN_TOKENS.animation.duration.normal}ms`,
            transitionTimingFunction: DESIGN_TOKENS.animation.easing.standard,
          }}
        />
        {isOpen ? label.replace("Show", "Hide") : label}
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all",
          !isOpen && "max-h-0 opacity-0",
          isOpen && "max-h-[2000px] opacity-100"
        )}
        style={{
          transitionDuration: `${DESIGN_TOKENS.animation.duration.slow}ms`,
          transitionTimingFunction: DESIGN_TOKENS.animation.easing.standard,
        }}
      >
        {children}
      </div>
    </div>
  )
}
