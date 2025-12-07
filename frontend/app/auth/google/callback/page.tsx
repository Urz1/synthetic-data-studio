"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeOAuthLogin } = useAuth()
  const token = searchParams.get("token")
  const errorParam = searchParams.get("error")

  const derivedError = useMemo(() => {
    if (errorParam) return errorParam === "access_denied" ? "You cancelled the login" : errorParam
    if (!token) return "No authentication token received"
    return ""
  }, [errorParam, token])

  const [status, setStatus] = useState<"loading" | "success" | "error">(derivedError ? "error" : "loading")
  const [error, setError] = useState<string>(derivedError)

  useEffect(() => {
    if (derivedError || !token) return

    // Complete OAuth login
    let cancelled = false

    const run = async () => {
      try {
        await completeOAuthLogin(token)
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
  }, [derivedError, token, completeOAuthLogin, router])

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

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  )
}
