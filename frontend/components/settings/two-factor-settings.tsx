"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react"

interface TwoFactorSettingsProps {
  is2FAEnabled: boolean
  onStatusChange: (enabled: boolean) => void
}

export function TwoFactorSettings({ is2FAEnabled, onStatusChange }: TwoFactorSettingsProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "disable">("idle")
  const [isLoading, setIsLoading] = useState(false)
  const [secret, setSecret] = useState("")
  const [otpauthUrl, setOtpauthUrl] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)

  const handleSetup = async () => {
    setIsLoading(true)
    try {
      const result = await api.setup2FA()
      setSecret(result.secret)
      setOtpauthUrl(result.otpauth_url)
      setStep("verify")
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to initialize 2FA setup",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await api.enable2FA(verificationCode)
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication is now active on your account",
      })
      onStatusChange(true)
      resetState()
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code to disable 2FA",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await api.disable2FA(verificationCode)
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      })
      onStatusChange(false)
      resetState()
    } catch (error) {
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "Invalid code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    toast({ title: "Copied!", description: "Secret key copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  const resetState = () => {
    setStep("idle")
    setVerificationCode("")
    setSecret("")
    setOtpauthUrl("")
    setShowManualEntry(false)
  }

  // 2FA is enabled - show status and disable option
  if (is2FAEnabled) {
    return (
      <Card className="bg-card/40 border-green-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-green-600 dark:text-green-400">2FA Enabled</CardTitle>
              <CardDescription>Your account is protected with two-factor authentication</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "disable" ? (
            <div className="space-y-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <p className="text-sm font-medium">Enter your authenticator code to disable 2FA:</p>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState} disabled={isLoading} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDisable} disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setStep("disable")} className="text-muted-foreground">
              <ShieldOff className="h-4 w-4 mr-2" />
              Disable two-factor authentication
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // 2FA not enabled - show setup flow
  return (
    <Card className="bg-card/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              Protect your account by requiring a verification code from your authenticator app in addition to your password.
            </p>
            <Button type="button" onClick={handleSetup} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Set up two-factor authentication
            </Button>
          </>
        )}

        {step === "verify" && (
          <div className="space-y-6">
            {/* Step 1: Scan QR Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <span className="font-medium">Scan QR code with your authenticator app</span>
              </div>
              <div className="flex justify-center p-6 bg-card rounded-xl border shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`}
                  alt="2FA QR Code"
                  className="w-44 h-44 rounded"
                />
              </div>
              
              {/* Collapsible manual entry */}
              <button
                type="button"
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                {showManualEntry ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Can't scan? Enter key manually
              </button>
              
              {showManualEntry && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-xs text-muted-foreground">Enter this key in your authenticator app:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded text-sm font-mono tracking-wide border">
                      {secret}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySecret}>
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Enter Verification Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <span className="font-medium">Enter the 6-digit code from your app</span>
              </div>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={resetState} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleEnable} disabled={isLoading || verificationCode.length !== 6} className="flex-1">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verify and activate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

