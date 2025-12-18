import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthFormEnhancer } from "@/components/auth/auth-form-enhancer"

// Purposeful display face for the marketing/auth pages
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] })

function getStringParam(value: string | string[] | undefined): string {
  if (!value) return ""
  return Array.isArray(value) ? value[0] ?? "" : value
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>
}) {
  const sp = await Promise.resolve(searchParams)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio"
  const next = getStringParam(sp.next) || "/dashboard"
  const error = getStringParam(sp.error)
  const emailFromQuery = getStringParam(sp.email)
  const unverified = getStringParam(sp.unverified) === "1"
  const registered = getStringParam(sp.registered) === "1"
  const verified = getStringParam(sp.verified) === "1"
  const reset = getStringParam(sp.reset) === "1"
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register"

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 ${jakarta.variable}`}>
      <nav className="fixed top-0 w-full z-50 bg-background/85 backdrop-blur-xl border-b border-border/70">
        <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="h-11 w-11 rounded-2xl overflow-hidden flex items-center justify-center bg-white/5 border border-white/10">
              <Image src="/FInal_Logo.png" alt="Synth Studio Logo" width={44} height={44} className="object-contain" />
            </div>
            <span className="hidden sm:block">Synth Studio</span>
          </Link>

          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to site</span>
          </Link>
        </div>
      </nav>

      <main className="pt-24 md:pt-28 pb-10 px-4">
        <div className="w-full max-w-md mx-auto space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground">Privacy-preserving synthetic data generation</p>
          </div>

          <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {registered && (
              <Alert className="mb-4">
                <AlertDescription>
                  Registration successful. Check your email for the verification link, then come back here to sign in.
                </AlertDescription>
              </Alert>
            )}

            {verified && (
              <Alert className="mb-4">
                <AlertDescription>Email verified. You can sign in now.</AlertDescription>
              </Alert>
            )}

            {reset && (
              <Alert className="mb-4">
                <AlertDescription>Password reset successful. Please sign in.</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {unverified && (
              <Alert className="mb-4">
                <AlertDescription>
                  <span className="block">Need a new verification email?</span>
                  <Link
                    href={`/verify-email${emailFromQuery ? `?email=${encodeURIComponent(emailFromQuery)}` : ""}`}
                    className="inline-block mt-2 text-foreground underline underline-offset-4 font-medium"
                  >
                    Resend verification email
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <form id="auth-login-form" action="/api/auth/login" method="post" className="space-y-4">
              <input type="hidden" name="next" value={next} />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  defaultValue={emailFromQuery || undefined}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>

              {/* OTP field - hidden by default, revealed when 2FA is required */}
              <div id="otp-field-container" className="space-y-2 hidden" data-otp-field="true">
                <Label htmlFor="otp">
                  Authentication Code
                  <span className="text-xs text-muted-foreground ml-2">(from your authenticator app)</span>
                </Label>
                <Input id="otp" name="otp" type="text" inputMode="numeric" maxLength={6} placeholder="123456" autoComplete="one-time-code" />
              </div>

              <Button type="submit" variant="secondary" className="w-full min-h-[44px] cursor-pointer">
                Sign In
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button asChild type="button" variant="outline" className="cursor-pointer hover:bg-accent hover:border-primary/50 transition-all duration-200">
                  <a href={`${apiUrl}/auth/google`}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </a>
                </Button>
                <Button asChild type="button" variant="outline" className="cursor-pointer hover:bg-accent hover:border-primary/50 transition-all duration-200">
                  <a href={`${apiUrl}/auth/github`}>
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                </Button>
              </div>
            </form>

            <AuthFormEnhancer formId="auth-login-form" mode="login" />
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
               <Link href={registerHref} className="text-foreground underline underline-offset-4 font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground">By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </main>
    </div>
  )
}
