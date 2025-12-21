"use client"

import Link from "next/link"
import Image from "next/image"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Shield,
  Zap,
  Database,
  Lock,
  CheckCircle2,
  Cpu,
  LineChart,
  Rocket,
  Menu,
  X,
  Github,
  Sparkles,
  Layers,
  Cloud,
  Wand2,
  Fingerprint,
  FileCheck,
  ShieldCheck,
  Activity,
  Sun,
  Moon,
} from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useState, useEffect } from "react"
import { AuthIntentLink } from "@/components/auth/auth-intent-link"
import dynamic from "next/dynamic"

// Dynamic import with SSR disabled - prevents ALL hydration mismatches
// HeroStory uses window.matchMedia, animations, and browser-only state
const HeroStory = dynamic(
  () => import("@/components/sections/HeroStory").then(m => m.HeroStory),
  { 
    ssr: false,
    loading: () => (
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 min-h-[600px] bg-background">
        <div className="container mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-muted rounded mx-auto" />
            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="h-[320px] bg-muted/50 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted/70 rounded w-full" />
                <div className="h-6 bg-muted/70 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
)

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] })

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    try {
      const stored = window.localStorage.getItem("landing-theme")
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true
      return stored ? stored === "dark" : prefersDark
    } catch {
      return true
    }
  })
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.85])
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.97])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle("dark", newDark)
    localStorage.setItem("landing-theme", newDark ? "dark" : "light")
  }

  const featurePillars = [
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Privacy Guarantees",
      description: "Built-in differential privacy with configurable budget controls. Your data patterns are learned, not copied.",
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Multiple Generation Modes",
      description: "Train ML models on your data, or use schema-based generation to create data instantly without training.",
    },
    {
      icon: <Wand2 className="h-6 w-6 text-primary" />,
      title: "Schema-Based Generation",
      description: "Define your columns and types, get realistic data in seconds. No training, no waiting. Perfect for prototyping.",
    },
    {
      icon: <LineChart className="h-6 w-6 text-primary" />,
      title: "Quality Evaluation",
      description: "Compare your synthetic data against the original. Get clear scores for statistical similarity and privacy.",
    },
    {
      icon: <Fingerprint className="h-6 w-6 text-primary" />,
      title: "PII Detection",
      description: "Automatic detection of names, emails, SSNs, and other sensitive fields before you generate.",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-primary" />,
      title: "Compliance Ready",
      description: "Export privacy reports and model cards as PDFs for HIPAA, GDPR, and audit documentation.",
    },
  ]

  const flows = [
    {
      label: "01",
      title: "Upload & Profile",
      detail: "Upload CSV/JSON. Schema detected automatically, PII flagged, data profiled.",
    },
    {
      label: "02",
      title: "Generate Safely",
      detail: "Choose your generator and privacy settings. DP budgets enforced with audit logging.",
    },
    {
      label: "03",
      title: "Evaluate & Export",
      detail: "Quality reports, privacy metrics, and compliance pack PDFs ready for download.",
    },
  ]

  return (
    <div
      className={`min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 ${jakarta.variable}`}
    >
      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/90 backdrop-blur-xl border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="h-11 w-11 rounded-2xl overflow-hidden flex items-center justify-center bg-muted border border-border">
              <Image src="/FInal_Logo.png" alt="Synth Studio Logo" width={44} height={44} className="object-contain" />
            </div>
            <span className="hidden sm:block">Synth Studio</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
              Security
            </Link>
            <Link href="https://docs.synthdata.studio" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Toggle theme">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <AuthIntentLink href="/login" eventLocation="navbar" mode="login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </AuthIntentLink>
            <Button asChild className="rounded-full px-5">
              <AuthIntentLink href="/register" eventLocation="navbar" mode="register">Get Started</AuthIntentLink>
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Toggle theme">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button className="text-foreground p-2" onClick={() => setMobileMenuOpen((s) => !s)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-[72px] left-0 w-full bg-background border-b border-border p-6 flex flex-col gap-4"
          >
            <Link href="#features" className="text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Features
            </Link>
            <Link href="#how-it-works" className="text-foreground" onClick={() => setMobileMenuOpen(false)}>
              How it works
            </Link>
            <Link href="#security" className="text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Security
            </Link>
            <Link href="https://docs.synthdata.studio" target="_blank" className="text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Docs
            </Link>
            <AuthIntentLink href="/login" eventLocation="mobile_nav" mode="login" className="text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Sign in
            </AuthIntentLink>
            <Button className="w-full rounded-full" asChild>
              <AuthIntentLink href="/register" eventLocation="mobile_nav" mode="register" onClick={() => setMobileMenuOpen(false)}>Get Started</AuthIntentLink>
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Animated Hero Story */}
      <HeroStory theme={isDark ? "dark" : "light"} />

      {/* What it does - honest section */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <Database className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Upload Your Data</h3>
              <p className="text-sm text-muted-foreground">CSV or JSON files with automatic schema detection</p>
            </div>
            <div className="p-4">
              <Cpu className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Train Generators</h3>
              <p className="text-sm text-muted-foreground">CTGAN, TVAE, or schema-based with DP options</p>
            </div>
            <div className="p-4">
              <FileCheck className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Evaluate & Export</h3>
              <p className="text-sm text-muted-foreground">Quality metrics and downloadable synthetic datasets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section id="features" className="py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.2em] text-primary mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">What Synth Studio Offers</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featurePillars.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/60 hover:-translate-y-1 transition-all"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="how-it-works" className="py-20 md:py-24 border-y border-border bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.2em] text-primary mb-2">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold">Three Simple Steps</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {flows.map((step) => (
              <div key={step.label} className="flex gap-4 p-5 rounded-2xl border border-border bg-card">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0">
                  {step.label}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & compliance */}
      <section id="security" className="py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-primary">Security</p>
              <h2 className="text-3xl md:text-4xl font-bold">Privacy-First Design</h2>
              <p className="text-muted-foreground">
                Your data never leaves your control. Configurable privacy budgets, 
                full audit trails, and compliance-ready exports keep your team protected.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {["Automatic PII Detection", "Configurable Privacy Budgets", "Complete Audit Trail", "Compliance PDF Exports"].map(
                  (item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="relative rounded-3xl border border-border bg-card p-6 shadow-lg overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" /> Security Features
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4 text-primary" /> Secure Authentication & Access Control
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Privacy Budget Enforcement
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" /> Full Audit Trail & Lineage
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cloud className="h-4 w-4 text-primary" /> Self-Host or Use Our Cloud
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center">
            <div className="relative space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create privacy-preserving synthetic data in minutes. Free to use, open source, and self-hostable.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                <Button size="lg" className="rounded-full px-7" asChild>
                  <AuthIntentLink href="/register" eventLocation="footer_cta" mode="register">Start Free</AuthIntentLink>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full" asChild>
                  <Link href="https://docs.synthdata.studio" target="_blank">Read the Docs</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background pt-14 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-muted border border-border">
                  <Image src="/FInal_Logo.png" alt="Synth Studio Logo" width={40} height={40} className="object-contain" />
                </div>
                Synth Studio
              </div>
              <p className="text-muted-foreground max-w-md text-sm">
                Open source platform for creating privacy-preserving synthetic data. Free to use and self-hostable.
              </p>
              <div className="flex gap-4 text-muted-foreground">
                <Link href="https://github.com/Urz1/synthetic-data-studio" className="hover:text-foreground" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="https://docs.synthdata.studio" target="_blank" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="https://github.com/Urz1/synthetic-data-studio" target="_blank" className="hover:text-foreground">
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="https://docs.synthdata.studio/docs/getting-started/quick-start" target="_blank" className="hover:text-foreground">
                    Quick Start
                  </Link>
                </li>
                <li>
                  <Link href="https://docs.synthdata.studio/docs/developer-guide/api-integration" target="_blank" className="hover:text-foreground">
                    API Reference
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-sm text-muted-foreground flex flex-col md:flex-row justify-between gap-3">
            <span>© 2025 Synth Studio. Open Source under MIT License.</span>
            <div className="flex gap-4">
              <Link href="https://github.com/Urz1/synthetic-data-studio" target="_blank" className="hover:text-foreground">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
