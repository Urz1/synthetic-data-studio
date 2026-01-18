"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { PasswordRequirements, usePasswordValidation } from "@/components/auth/password-requirements"
import { resetPassword } from "@/lib/auth-client"

interface BetterAuthResetPasswordFormProps {
  token?: string
}

export function BetterAuthResetPasswordForm({ token }: BetterAuthResetPasswordFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Use password validation hook for UI feedback
  usePasswordValidation(password)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    
    const formToken = token || (new FormData(e.currentTarget).get("token") as string)

    if (!formToken) {
        toast.error("Missing reset token")
        setLoading(false)
        return
    }

    try {
      const { data, error } = await resetPassword({
        newPassword: password,
        token: formToken,
      })

      if (error) {
        toast.error(error.message || "Failed to reset password")
      } else {
        toast.success("Password reset successfully")
        router.push("/login?reset=success")
      }
    } catch (err) {
        console.error(err)
        toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* If token is not provided in props (URL), ask for it */}
      {!token && (
        <div className="space-y-2">
            <Label htmlFor="token">Reset Token</Label>
            <Input 
                id="token" 
                name="token" 
                placeholder="Paste token from email" 
                required 
                disabled={loading}
            />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="new_password">New Password</Label>
        <PasswordInput 
          id="new_password" 
          name="newPassword" 
          placeholder="••••••••" 
          autoComplete="new-password" 
          required 
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <PasswordRequirements password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <PasswordInput 
          id="confirm_password" 
          name="confirmPassword" 
          placeholder="••••••••" 
          autoComplete="new-password" 
          required 
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <Button 
        type="submit" 
        variant="secondary" 
        className="w-full min-h-[44px] cursor-pointer"
        disabled={loading}
      >
        {loading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
            </>
        ) : (
            "Reset Password"
        )}
      </Button>
    </form>
  )
}
