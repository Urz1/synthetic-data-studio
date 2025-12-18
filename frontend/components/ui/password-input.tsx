"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  showToggle?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    // Track mount state for interactive functionality only
    React.useEffect(() => {
      setMounted(true)
    }, [])

    return (
      <div className="relative">
        <Input
          // Always start as password type for autofill compatibility
          // Only switch to text when user explicitly clicks toggle
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        {/* 
          HYDRATION FIX: Always render the button to ensure server/client HTML match.
          Use CSS visibility to hide before mount instead of conditional rendering.
        */}
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground",
              // Hide button until mounted to prevent flash, but always render it
              !mounted && "invisible"
            )}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {/* Always render Eye icon on server to match initial client render */}
            {mounted && showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }


