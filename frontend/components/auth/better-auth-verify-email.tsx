"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { verifyEmail } from "@/lib/auth-client"

export function BetterAuthVerifyEmail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("Verifying your email...")

  useEffect(() => {
    if (!token) {
        // Should not happen if this component is conditionally rendered
        setStatus("error")
        setMessage("Missing verification token")
        return
    }

    const verify = async () => {
        try {
            const { data, error } = await verifyEmail({
                query: {
                    token: token
                }
            })

            if (error) {
                setStatus("error")
                setMessage(error.message || "Failed to verify email. The link may have expired.")
            } else {
                setStatus("success")
                setMessage("Email verified successfully!")
                toast.success("Email verified successfully!")
                // Redirect after delay
                setTimeout(() => {
                    router.push("/dashboard")
                }, 2000)
            }
        } catch (error) {
            console.error(error)
            setStatus("error")
            setMessage("An unexpected error occurred")
        }
    }

    verify()
  }, [token, router])

  if (status === "verifying") {
      return (
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground">{message}</p>
          </div>
      )
  }

  if (status === "success") {
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold text-foreground">Verified!</h3>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Continue to Dashboard
            </Button>
        </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-semibold text-foreground">Verification Failed</h3>
        <p className="text-destructive">{message}</p>
        <Button onClick={() => router.push("/verify-email")} variant="outline" className="mt-4">
            Request New Link
        </Button>
    </div>
  )
}
