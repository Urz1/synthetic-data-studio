"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"

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
    console.log("[OAuth Callback] All searchParams:", Object.fromEntries(searchParams.entries()));
    console.log("[OAuth Callback] Token from URL:", token);
    console.log("[OAuth Callback] Error from URL:", errorParam);
    
    if (errorParam) {
      const errorMsg = errorParam === "access_denied" ? "You cancelled the login" : errorParam
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
        console.log("[OAuth Callback] Starting to process token...");
        
        // Extract user data from URL params
        const userId = searchParams.get("user_id");
        const email = searchParams.get("email");
        const name = searchParams.get("name");
        const avatarUrl = searchParams.get("avatar_url");
        const role = searchParams.get("role");

        console.log("[OAuth Callback] User data:", { userId, email, name, role });

        const user = {
          id: userId,
          email: email,
          name: name,
          avatar_url: avatarUrl,
          role: role
        };

        // Store token and user data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        console.log("[OAuth Callback] Stored to localStorage, redirecting to dashboard...");

        if (cancelled) return;
        setStatus("success");
        // Use window.location for clean redirect after OAuth
        window.location.href = "/dashboard";
      } catch (err: any) {
        console.error("[OAuth Callback] Error:", err);
        if (cancelled) return;
        setStatus("error");
        setError(err?.message || "Failed to complete login");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
