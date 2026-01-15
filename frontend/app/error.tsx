"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Home, RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  // Check if this is an HMR-related error
  const isHMRError =
    error.message.includes("module factory") ||
    error.message.includes("HMR") ||
    error.message.includes("was instantiated");

  const handleRefresh = () => {
    // For HMR errors, do a full page reload to clear module cache
    if (isHMRError) {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <AppShell user={user || { full_name: "", email: "" }}>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Error Icon */}
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-2xl p-6 border border-destructive/30 shadow-xl">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <div className="inline-block">
              <span className="text-xs font-mono text-destructive uppercase tracking-wider bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
                {isHMRError ? "Development Issue" : "System Alert"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {isHMRError
                ? "Development Server Issue"
                : "Processing Interrupted"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isHMRError
                ? "Development server encountered a hot reload issue. Refreshing will fix this."
                : "We encountered an unexpected error. Don't worry - your data is safe and our team has been notified."}
            </p>
          </div>

          {/* Error Details */}
          {process.env.NODE_ENV === "development" && (
            <div className="max-w-2xl mx-auto">
              <Alert className="text-left">
                <AlertDescription className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium">Error Details</p>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {error.message || "An unexpected error occurred"}
                      </p>
                    </div>
                  </div>
                  {error.digest && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Error ID:{" "}
                        <code className="font-mono">{error.digest}</code>
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button onClick={handleRefresh} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {isHMRError ? "Refresh Page" : "Try Again"}
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              size="lg"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>

          {/* Help Text */}
          {!isHMRError && (
            <div className="pt-8">
              <p className="text-sm text-muted-foreground">
                If this persists,{" "}
                <a
                  href="mailto:support@synthstudio.ai"
                  className="text-primary hover:underline"
                >
                  contact support
                </a>{" "}
                with error ID {error.digest || "N/A"}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
