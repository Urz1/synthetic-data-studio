"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

/**
 * Auth Success Page - Handles OAuth callback tokens securely
 * 
 * This page reads tokens from the URL hash fragment (which never hits the server),
 * then POSTs them to /auth/session to set HTTP-only cookies.
 * 
 * Flow:
 * 1. OAuth callback redirects here with: /auth/success#token=xxx&refresh=yyy&expires_in=zzz
 * 2. This page reads the hash fragment (client-side only)
 * 3. POSTs tokens to backend /auth/session endpoint
 * 4. Backend sets secure HTTP-only cookies
 * 5. Redirects to /dashboard with clean URL
 * 
 * Security:
 * - Hash fragment is NEVER sent to the server (browser behavior)
 * - Tokens don't appear in server logs, analytics, or browser history
 * - Final cookies are HttpOnly, Secure, SameSite=Strict
 */
export default function AuthSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Read tokens from hash fragment
        const hash = window.location.hash.substring(1) // Remove leading #
        if (!hash) {
          setStatus("error")
          setError("No authentication data received")
          return
        }

        const params = new URLSearchParams(hash)
        const accessToken = params.get("token")
        const refreshToken = params.get("refresh")
        const expiresIn = params.get("expires_in")

        if (!accessToken || !refreshToken) {
          setStatus("error")
          setError("Invalid authentication data")
          return
        }

        // POST to FRONTEND's /api/auth/session to set cookies
        // CRITICAL: Must be frontend domain so middleware can read cookies
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            access: accessToken,
            refresh: refreshToken,
            expires_in: parseInt(expiresIn || "1800", 10)
          })
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || "Failed to set session")
        }

        // Also store in localStorage for client-side auth context
        localStorage.setItem("token", accessToken)
        
        setStatus("success")
        
        // Clean redirect to dashboard (no tokens in URL)
        // Use replace to prevent back-button returning to this page
        window.location.replace("/dashboard")
        
      } catch (err) {
        console.error("Auth success error:", err)
        setStatus("error")
        setError(err instanceof Error ? err.message : "Authentication failed")
      }
    }

    processAuth()
  }, [])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-destructive">Authentication Error</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button asChild variant="outline">
          <a href="/login">Back to login</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Success! Redirecting to dashboard...</p>
    </div>
  )
}
