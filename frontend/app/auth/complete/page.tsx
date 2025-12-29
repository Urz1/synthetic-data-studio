"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * OAuth Completion Page
 * 
 * This page is the landing point after OAuth redirect. It extracts the 
 * exchange token from the URL and calls the backend to exchange it for
 * session cookies via a same-origin request.
 * 
 * Flow:
 * 1. Google/GitHub OAuth callback redirects here with ?token=XXX
 * 2. We call POST /api/auth/exchange-token?token=XXX
 * 3. Backend validates the token and sets cookies in the response
 * 4. We redirect to /dashboard
 */

function AuthCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setError("Missing authentication token");
      setIsProcessing(false);
      return;
    }

    // Exchange the token for session cookies
    const exchangeToken = async () => {
      try {
        const response = await fetch(`/api/auth/exchange-token?token=${encodeURIComponent(token)}`, {
          method: "POST",
          credentials: "include", // Ensure cookies are saved
          headers: {
            "Content-Type": "application/json",
          },
        }); 

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to complete authentication");
        }

        const data = await response.json();
        
        if (data.success) {
          // Success! Redirect to dashboard
          // Use replace to avoid back-button issues
          router.replace("/dashboard");
        } else {
          throw new Error("Authentication failed");
        }
      } catch (err) {
        console.error("Token exchange failed:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setIsProcessing(false);
        
        // Redirect to login after showing error briefly
        setTimeout(() => {
          router.replace("/login?error=oauth_failed");
        }, 2000);
      }
    };

    exchangeToken();
  }, [searchParams, router]);

  return (
    <div className="text-center space-y-4">
      {isProcessing ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-xl font-semibold">Completing sign in...</h1>
          <p className="text-muted-foreground">Please wait while we set up your session</p>
        </>
      ) : error ? (
        <>
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-2xl">!</span>
          </div>
          <h1 className="text-xl font-semibold text-destructive">Authentication Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </>
      ) : null}
    </div>
  );
}

function AuthCompleteLoading() {
  return (
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <h1 className="text-xl font-semibold">Loading...</h1>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={<AuthCompleteLoading />}>
        <AuthCompleteContent />
      </Suspense>
    </div>
  );
}

