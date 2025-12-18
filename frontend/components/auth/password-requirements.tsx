"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordRequirementProps {
  met: boolean
  text: string
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={cn(met ? "text-green-500" : "text-muted-foreground")}>
        {text}
      </span>
    </div>
  )
}

interface PasswordRequirementsProps {
  password: string
  className?: string
}

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  const requirements = [
    {
      met: password.length >= 8,
      text: "At least 8 characters",
    },
    {
      met: /[A-Z]/.test(password),
      text: "At least 1 uppercase letter",
    },
    {
      met: /[0-9]/.test(password),
      text: "At least 1 number",
    },
    {
      met: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
      text: "At least 1 special character",
    },
  ]

  const allMet = requirements.every((req) => req.met)

  return (
    <div className={cn("space-y-1.5 py-2", className)}>
      {requirements.map((req, idx) => (
        <PasswordRequirement key={idx} met={req.met} text={req.text} />
      ))}
      {allMet && password.length > 0 && (
        <p className="text-xs text-green-500 font-medium mt-2">
          ✓ Password meets all requirements
        </p>
      )}
    </div>
  )
}

// Hook for easy password validation
export function usePasswordValidation(password: string) {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    isValid:
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
  }
}
