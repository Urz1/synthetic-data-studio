"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")

  const derivedError = useMemo(() => {
    if (errorParam) return errorParam === "access_denied" ? "You cancelled the authorization" : errorParam
    if (!code) return "No authorization code received"
    return ""
  }, [errorParam, code])

  const [status, setStatus] = useState<"loading" | "success" | "error">(derivedError ? "error" : "loading")
  const [error, setError] = useState<string>(derivedError)

  useEffect(() => {
    if (derivedError || !code) return

    // Fetch OAuth token from backend
    let cancelled = false

    const run = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://synthdata.studio'
        const response = await fetch(`${apiUrl}/auth/github/callback?code=${code}&state=${state || ''}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "OAuth authentication failed")
        }
        
        const data = await response.json()
        const { access_token, user } = data
        
        if (!access_token) {
          throw new Error("No access token received from server")
        }

        // Store token and user data
        localStorage.setItem("token", access_token)
        localStorage.setItem("user", JSON.stringify(user))
        
        if (cancelled) return
        setStatus("success")
        // Use window.location for clean redirect after OAuth
        window.location.href = "/dashboard"
      } catch (err: any) {
        if (cancelled) return
        setStatus("error")
        setError(err?.message || "Failed to complete login")
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [derivedError, code, state, router])

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">
      <p>Completing sign in...</p>
    </div>
  }

  if (status === "error") {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-red-500">Error: {error}</p>
      <a href="/login" className="text-blue-500 underline">Try again</a>
    </div>
  }

  return <div className="flex min-h-screen items-center justify-center">
    <p>Success! Redirecting to dashboard...</p>
  </div>
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  )
}
