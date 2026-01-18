"use client"

import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendVerificationEmail } from "@/lib/auth-client"

interface BetterAuthVerifyEmailRequestFormProps {
    defaultEmail?: string
}

export function BetterAuthVerifyEmailRequestForm({ defaultEmail }: BetterAuthVerifyEmailRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    try {
      const { data, error } = await sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      })

      if (error) {
        toast.error(error.message || "Failed to send verification email")
      } else {
        setSuccess(true)
        toast.success("Verification email sent")
      }
    } catch (err) {
        console.error(err)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
      return (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-green-600 text-sm">
          <p>We've sent a verification link to your email.</p>
          <p className="mt-2">Please check your inbox and click the link to verify your account.</p>
          <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setSuccess(false)}
          >
              Send another link
          </Button>
        </div>
      )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          defaultValue={defaultEmail}
          required
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
                Sending...
            </>
        ) : (
            "Send verification link"
        )}
      </Button>
    </form>
  )
}
