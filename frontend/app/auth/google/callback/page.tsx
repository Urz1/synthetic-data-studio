"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      setStatus("error")
      setError(errorParam === "access_denied" ? "You cancelled the login" : errorParam)
      return
    }

    if (!code || !state) {
      setStatus("error")
      setError("Invalid callback parameters")
      return
    }

    api
      .handleGoogleCallback(code, state)
      .then(() => {
        setStatus("success")
        setTimeout(() => router.push("/dashboard"), 1000)
      })
      .catch((err) => {
        setStatus("error")
        setError(err.message || "Authentication failed")
      })
  }, [searchParams, router])

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">
      <p>Authenticating...</p>
    </div>
  }

  if (status === "error") {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-red-500">Error: {error}</p>
      <a href="/login" className="text-blue-500 underline">Try again</a>
    </div>
  }

  return <div className="flex min-h-screen items-center justify-center">
    <p>Success! Redirecting...</p>
  </div>
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  )
}
