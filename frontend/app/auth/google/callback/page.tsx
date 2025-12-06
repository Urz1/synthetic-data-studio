"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeOAuthLogin } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Get token from URL params (backend redirects here with token)
    const token = searchParams.get("token")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      setStatus("error")
      setError(errorParam === "access_denied" ? "You cancelled the login" : errorParam)
      return
    }

    if (!token) {
      setStatus("error")
      setError("No authentication token received")
      return
    }

    // Complete OAuth login
    completeOAuthLogin(token)
      .then(() => {
        setStatus("success")
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      })
      .catch((err) => {
        setStatus("error")
        setError(err.message || "Failed to complete login")
      })
  }, [searchParams, router, completeOAuthLogin])

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
