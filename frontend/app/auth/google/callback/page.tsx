"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * OAuth Callback Handler - Google
 * 
 * This page handles any case where the browser navigates here after OAuth.
 * The actual OAuth processing happens on the backend, which should redirect
 * directly to /dashboard. This page exists as a fallback safety net.
 */
export default function GoogleCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard - middleware will handle auth checks
    const timer = setTimeout(() => {
      router.replace("/dashboard")
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
