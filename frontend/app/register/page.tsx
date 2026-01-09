import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BetterAuthRegisterForm } from "@/components/auth/better-auth-register-form"
import { DashboardPrefetcher } from "@/components/auth/dashboard-prefetcher"

// Purposeful display face for the marketing/auth pages
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] })

function getStringParam(value: string | string[] | undefined): string {
  if (!value) return ""
  return Array.isArray(value) ? value[0] ?? "" : value
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>
}) {
  const sp = await Promise.resolve(searchParams)
  const next = getStringParam(sp.next) || "/dashboard"
  const error = getStringParam(sp.error)
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login"

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 ${jakarta.variable}`}>
      {/* Prefetch dashboard while user types - zero visible impact */}
      <DashboardPrefetcher />
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
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground">Start generating privacy-preserving synthetic data</p>
          </div>

          <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Sign up for Synth Studio</CardTitle>
            <CardDescription>Create a new account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <BetterAuthRegisterForm callbackURL={next} externalError={error} />
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={loginHref} className="text-foreground underline underline-offset-4 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground">By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </main>
    </div>
  )
}

