import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthFormEnhancer } from "@/components/auth/auth-form-enhancer"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] })

function getStringParam(value: string | string[] | undefined): string {
  if (!value) return ""
  return Array.isArray(value) ? value[0] ?? "" : value
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>
}) {
  const sp = await Promise.resolve(searchParams)

  const error = getStringParam(sp.error)
  const sent = getStringParam(sp.sent) === "1"

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
            <h1 className="text-3xl font-bold tracking-tight">Forgot password</h1>
            <p className="text-muted-foreground">We’ll email you a reset link</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Reset your password</CardTitle>
              <CardDescription>Enter your email address to receive a password reset link</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {sent && (
                <Alert className="mb-4">
                  <AlertDescription>
                    If an account exists for that email, we sent a reset link.
                  </AlertDescription>
                </Alert>
              )}

              <form id="forgot-password-form" action="/api/auth/password-reset/request" method="post" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
                </div>

                <Button type="submit" variant="secondary" className="w-full min-h-[44px] cursor-pointer">
                  Send reset link
                </Button>
              </form>

              <AuthFormEnhancer formId="forgot-password-form" mode="generic" />
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link href="/login" className="text-foreground underline underline-offset-4 font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
