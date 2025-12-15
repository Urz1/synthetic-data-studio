"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2, ShieldAlert } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
      router.push(`/login?next=${next}`)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check admin requirement
  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You do not have permission to access this page. This area is restricted to administrators only.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return <>{children}</>
}
