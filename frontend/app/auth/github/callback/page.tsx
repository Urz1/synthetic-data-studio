"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

function CallbackContent() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Access window only in useEffect (client-side)
    const searchParams = new URLSearchParams(window.location.search)
    const token = searchParams.get("token")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      const errorMsg = errorParam === "access_denied" ? "You cancelled the authorization" : errorParam
      setStatus("error")
      setError(errorMsg)
      return;
    }
    
    if (!token) {
      setStatus("error")
      setError("No authentication token received")
      return;
    }

    // Backend already validated and sent token in URL
    let cancelled = false;

    const run = async () => {
      try {
        // Extract user data from URL params
        const userId = searchParams.get("user_id");
        const email = searchParams.get("email");
        const name = searchParams.get("name");
        const avatarUrl = searchParams.get("avatar_url");
        const role = searchParams.get("role");

        const user = {
          id: userId,
          email: email,
          name: name,
          avatar_url: avatarUrl,
          role: role
        };

        // Store token in localStorage for client-side auth context
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        // CRITICAL: Also set the ss_jwt cookie for server-side middleware auth
        // The middleware checks cookies, not localStorage, for protected routes
        const isSecure = window.location.protocol === "https:";
        document.cookie = `ss_jwt=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
        
        if (cancelled) return;
        setStatus("success");
        // Use window.location for clean redirect after OAuth
        window.location.href = "/dashboard";
      } catch (err: unknown) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to complete login");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

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

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}

