"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Auth Success Page - Fallback redirect handler
 * 
 * This page handles the case where OAuth callback redirects here instead
 * of directly to /dashboard. It immediately redirects to dashboard.
 * 
 * The backend should redirect directly to /dashboard, but this page
 * exists as a safety net for any edge cases.
 */
export default function AuthSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if we have an authentication cookie
    // If so, redirect to dashboard
    // If not, redirect to login
    
    // Give a tiny delay for cookies to be set
    const timer = setTimeout(() => {
      // Check for the presence of auth cookie by trying to access a protected resource
      // For now, just redirect to dashboard - the middleware will handle auth checks
      router.replace("/dashboard")
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  )
}
