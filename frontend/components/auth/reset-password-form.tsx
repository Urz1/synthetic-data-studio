"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { PasswordRequirements, usePasswordValidation } from "@/components/auth/password-requirements"
import { AuthFormEnhancer } from "@/components/auth/auth-form-enhancer"

interface ResetPasswordFormProps {
  token?: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const passwordValidation = usePasswordValidation(password)
  
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword
  const showMismatchError = confirmPassword.length > 0 && password !== confirmPassword

  return (
    <>
      <form id="reset-password-form" action="/api/auth/password-reset/confirm" method="post" className="space-y-4">
        {/* Token is hidden - auto-populated from URL */}
        <input type="hidden" name="token" value={token || ""} />
        
        {/* Only show token input if not provided in URL */}
        {!token && (
          <div className="space-y-2">
            <Label htmlFor="token-input">Reset Token</Label>
            <Input 
              id="token-input" 
              name="token" 
              type="text" 
              placeholder="Paste the token from your email" 
              required 
            />
            <p className="text-xs text-muted-foreground">
              Check your email for the password reset token
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <PasswordInput 
            id="new_password" 
            name="new_password" 
            placeholder="••••••••" 
            autoComplete="new-password" 
            required 
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordRequirements password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <PasswordInput 
            id="confirm_password" 
            name="confirm_password" 
            placeholder="••••••••" 
            autoComplete="new-password" 
            required 
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={showMismatchError ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {showMismatchError && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          {confirmPassword.length > 0 && passwordsMatch && (
            <p className="text-xs text-green-500">✓ Passwords match</p>
          )}
        </div>

        <Button 
          type="submit" 
          variant="secondary" 
          className="w-full min-h-[44px] cursor-pointer"
          disabled={!passwordValidation.isValid || !passwordsMatch}
        >
          Reset Password
        </Button>
      </form>

      <AuthFormEnhancer formId="reset-password-form" mode="generic" />
    </>
  )
}
