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
  Twitter,
  Sparkles,
  Layers,
  Cloud,
  Wand2,
  Fingerprint,
  FileCheck,
  ShieldCheck,
  Activity,
} from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useState, useEffect } from "react"
import { AuthIntentLink } from "@/components/auth/auth-intent-link"

// Purposeful display face for the marketing page
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] })

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.85])
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.97])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const featurePillars = [
    {
      icon: <Shield className="h-6 w-6 text-cyan-300" />,
      title: "Differential Privacy, by Default",
      description: "RDP accounting, DP-SGD, and epsilon controls baked into every generator run.",
    },
    {
      icon: <Zap className="h-6 w-6 text-purple-300" />,
      title: "Fast, Multi-Modal Synthesis",
      description: "CTGAN, TVAE, TimeGAN, schema-first generators, and GPU-accelerated pipelines.",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-emerald-300" />,
      title: "Compliance Packs in One Click",
      description: "HIPAA/GDPR/SOC-2 mapping, audit logs, and exportable evidence PDFs out-of-the-box.",
    },
    {
      icon: <LineChart className="h-6 w-6 text-blue-300" />,
      title: "Truthful Evaluation",
      description: "Utility, privacy leakage, drift, and bias checks with clear pass/fail thresholds.",
    },
    {
      icon: <Fingerprint className="h-6 w-6 text-orange-300" />,
      title: "PII Hunts & Mitigation",
      description: "Regex + LLM detection, column-level flags, and automatic redaction before training.",
    },
    {
      icon: <Rocket className="h-6 w-6 text-pink-300" />,
      title: "Enterprise Delivery",
      description: "Postgres/S3, Redis, Celery jobs, edge caching, and hardened auth for production.",
    },
  ]

  const flows = [
    {
      label: "01",
      title: "Ingest & Profile",
      detail: "Upload CSV/JSON or connect a warehouse. Schema detected, PII flagged, drift baselines captured.",
    },
    {
      label: "02",
      title: "Generate Safely",
      detail: "Choose CTGAN/TVAE/TimeGAN or schema-only. DP budgets enforced with guardrails and audit events.",
    },
    {
      label: "03",
      title: "Validate & Ship",
      detail: "Quality + privacy reports, compliance pack PDFs, and signed exports with lineage & ETags for cacheable delivery.",
    },
  ]

  const highlights = [
    { title: "<500ms", subtitle: "Time to interactive", tone: "text-emerald-300" },
    { title: "98.5%", subtitle: "Fidelity score on benchmark EHR", tone: "text-blue-300" },
    { title: "1.2M", subtitle: "Rows generated/min on GPU", tone: "text-purple-300" },
  ]

  const trustLogos = ["HelixCare", "NovaBank", "Axiom Labs", "Northwind", "Lumina"]

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 ${jakarta.variable}`}>
      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/85 backdrop-blur-xl border-b border-border/70" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="h-11 w-11 rounded-2xl overflow-hidden flex items-center justify-center bg-white/5 border border-white/10">
              <Image src="/FInal_Logo.png" alt="Synth Studio Logo" width={44} height={44} className="object-contain" />
            </div>
            <span className="hidden sm:block">Synth Studio</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
              Platform
            </Link>
            <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How it works
            </Link>
            <Link href="#security" className="text-gray-300 hover:text-white transition-colors">
              Security
            </Link>
            <AuthIntentLink href="/login" eventLocation="navbar" mode="login" className="text-gray-200 hover:text-white transition-colors">
              Sign in
            </AuthIntentLink>
            <Button asChild className="rounded-full px-5 bg-white text-black hover:bg-gray-100">
              <AuthIntentLink href="/register" eventLocation="navbar" mode="register">Launch Studio</AuthIntentLink>
            </Button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen((s) => !s)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-[72px] left-0 w-full bg-background border-b border-border/70 p-6 flex flex-col gap-4"
          >
            <Link href="#features" className="text-gray-200" onClick={() => setMobileMenuOpen(false)}>
              Platform
            </Link>
            <Link href="#how-it-works" className="text-gray-200" onClick={() => setMobileMenuOpen(false)}>
              How it works
            </Link>
            <Link href="#security" className="text-gray-200" onClick={() => setMobileMenuOpen(false)}>
              Security
            </Link>
            <AuthIntentLink href="/login" eventLocation="mobile_nav" mode="login" className="text-gray-200" onClick={() => setMobileMenuOpen(false)}>
              Sign in
            </AuthIntentLink>
            <Button className="w-full rounded-full bg-white text-black" asChild>
              <AuthIntentLink href="/register" eventLocation="mobile_nav" mode="register" onClick={() => setMobileMenuOpen(false)}>Launch Studio</AuthIntentLink>
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden bg-gradient-to-b from-background via-background to-background/95">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-24 top-10 h-96 w-96 bg-purple-600/20 blur-[120px] rounded-full" />
          <div className="absolute right-[-12%] bottom-0 h-[420px] w-[420px] bg-blue-500/15 blur-[120px] rounded-full" />
          <div className="absolute inset-0 opacity-15 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div className="space-y-7">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-sm text-primary"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400" />
                </span>
                v2.1 · Schema Generator + 70% edge cache hit
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 }}
                className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-balance"
              >
                Ship synthetic data twins
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-200 to-cyan-200">
                  without leaking a single row
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="text-lg text-muted-foreground max-w-2xl"
              >
                Synth Studio ingests your raw data, hunts PII, enforces differential privacy, and delivers audit-ready compliance packs.
                Edge caching and background jobs keep every workflow sub-second.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button size="lg" className="h-12 rounded-full px-6" asChild>
                  <AuthIntentLink href="/register" eventLocation="hero" mode="register">Launch the Studio</AuthIntentLink>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full px-6"
                  asChild
                >
                  <Link href="https://github.com/Urz1/synthetic-data-studio" target="_blank" rel="noreferrer">
                    <Github className="h-5 w-5 mr-2" />
                    View on GitHub
                  </Link>
                </Button>
              </motion.div>

              <div className="grid grid-cols-3 gap-4 md:max-w-xl">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur"
                  >
                    <div className={`text-2xl font-semibold ${item.tone}`}>{item.title}</div>
                    <div className="text-xs text-gray-400">{item.subtitle}</div>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale }}
              className="relative"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-cyan-400/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                  <div className="font-mono text-xs text-muted-foreground">/api/generators/123</div>
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
                  </div>
                </div>
                <div className="p-6 grid md:grid-cols-[1.35fr_0.9fr] gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">Training status</div>
                      <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-300 px-3 py-1 text-xs">
                        <Sparkles className="h-4 w-4" /> Completed
                      </span>
                    </div>
                    <div className="h-52 rounded-2xl bg-gradient-to-b from-muted/30 to-transparent border border-border/60 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-end gap-2 px-4 pb-4">
                        {[38, 62, 44, 90, 75, 82, 58, 96, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-lg bg-gradient-to-t from-purple-500/70 via-blue-400/60 to-cyan-300/80"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div className="absolute top-3 left-3 text-xs text-gray-400">Utility vs real data</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {[
                        { label: "Rows generated", value: "1.2M", tone: "text-blue-200" },
                        { label: "Epsilon", value: "1.0", tone: "text-emerald-200" },
                        { label: "Leakage", value: "0.0%", tone: "text-purple-200" },
                      ].map((card) => (
                        <div key={card.label} className="rounded-xl border border-border/60 bg-card/70 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-gray-500">{card.label}</div>
                          <div className={`text-lg font-semibold ${card.tone}`}>{card.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Cpu className="h-4 w-4 text-purple-200" /> DP Engine
                        </div>
                        <span className="text-xs text-gray-400">GPU enabled</span>
                      </div>
                      <div className="space-y-1 font-mono text-xs text-gray-300">
                        <div className="text-purple-200">✔ DP budget validated</div>
                        <div>✔ Noise multiplier calibrated</div>
                        <div>✔ Gradient clipping enforced</div>
                        <div className="text-emerald-200">✔ Audit log sealed</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <ShieldCheck className="h-4 w-4 text-emerald-200" /> Compliance snapshot
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> HIPAA pass
                        </span>
                        <span className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-blue-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> GDPR pass
                        </span>
                        <span className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-purple-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> SOC-2 ready
                        </span>
                        <span className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> PII zeroed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-10 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-6">
          <p className="text-center text-xs tracking-[0.2em] text-gray-500 mb-6">TRUSTED BY TEAMS THAT SHIP FAST</p>
            <div className="flex flex-wrap justify-center gap-10 md:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {trustLogos.map((name) => (
              <div key={name} className="flex items-center gap-2 text-lg font-semibold text-white/80">
                <div className="h-6 w-6 rounded-full bg-white/15" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section id="features" className="py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-purple-200/80">Platform</p>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">The secure way to synthesize, evaluate, and export</h2>
            </div>
            <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" asChild>
              <AuthIntentLink href="/login" eventLocation="platform_section" mode="login">Go to dashboard</AuthIntentLink>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featurePillars.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className="p-6 rounded-2xl border border-border/60 bg-card/70 backdrop-blur hover:border-primary/60 hover:-translate-y-1 transition-all"
              >
                <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="how-it-works" className="py-20 md:py-24 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.2em] text-purple-200/80">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold">From raw to ready in three guarded moves</h2>
            <p className="text-gray-400 max-w-2xl">
              Every step is logged, cached, and privacy-checked. Background jobs keep heavy lifting off the UI while you
              monitor with real-time progress and ETag-friendly API responses.
            </p>
            <div className="space-y-4">
              {flows.map((step) => (
                <div key={step.label} className="flex gap-4 p-4 rounded-2xl border border-border/60 bg-card/70">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-200 font-bold">
                    {step.label}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button className="rounded-full px-6" asChild>
                <AuthIntentLink href="/register" eventLocation="pricing_section" mode="register">Start free</AuthIntentLink>
              </Button>
              <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/contact">Talk with us</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-purple-500/30 blur-2xl" />
            <div className="absolute -right-10 bottom-4 h-20 w-20 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-border/60 bg-card/70">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  Run summary
                </div>
                <span className="text-xs text-muted-foreground">Cached · ETag: &quot;abc123&quot;</span>
              </div>
              <div className="p-6 space-y-3 text-sm font-mono">
                <div className="flex items-center gap-2 text-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" /> POST /datasets/upload → 200 (304 on repeat)
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" /> POST /generators/dataset/{"{id}"}/generate → 202
                </div>
                <div className="flex items-center gap-2 text-success">
                  <ArrowRight className="h-4 w-4 text-success" /> GET /jobs/{"{id}"} → state: SUCCESS
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <ArrowRight className="h-4 w-4 text-primary" /> GET /evaluations/{"{id}"} → cached 304
                </div>
                <div className="flex items-center gap-2 text-warning">
                  <ArrowRight className="h-4 w-4 text-warning" /> POST /llm/privacy-report/export/pdf → sealed
                </div>
              </div>
              <div className="border-t border-border/60 bg-muted/30 p-6 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-success flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Background jobs via Celery
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-primary flex items-center gap-2">
                  <Cloud className="h-4 w-4" /> S3 + Postgres, Redis cache
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-primary flex items-center gap-2">
                  <Wand2 className="h-4 w-4" /> LLM assists for PII & docs
                </div>
                <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-warning flex items-center gap-2">
                  <Shield className="h-4 w-4" /> DP budgets enforced
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & compliance */}
      <section id="security" className="py-20 md:py-24">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-purple-200/80">Security</p>
            <h2 className="text-3xl md:text-4xl font-bold">Privacy guardrails that cannot be bypassed</h2>
            <p className="text-muted-foreground">
              JWT auth + role-based access, DP validation before every run, audit logging, and signed exports. Edge cache
              headers (ETag, must-revalidate) reduce origin exposure while keeping responses instant.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {["PII scanning (regex + LLM)", "DP-SGD with RDP accounting", "Audit logs & lineage", "Compliance PDFs: HIPAA/GDPR/SOC-2"].map(
                (item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-4">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="relative rounded-3xl border border-border/60 bg-card/70 p-6 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-primary/5 to-primary/5" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Shield className="h-4 w-4 text-success" /> Security posture
                </div>
                <span className="text-xs text-muted-foreground">Last scan: 2m ago</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {["HIPAA", "GDPR", "SOC-2"].map((tag) => (
                  <div key={tag} className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-center text-success">
                    {tag} ✓
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 font-mono text-xs text-foreground">
                <div className="text-primary">[audit] generator_id=123 status=SUCCESS</div>
                <div className="text-primary">[dp] epsilon=1.0 delta=1e-5 noise_multiplier=1.2</div>
                <div className="text-success">[pii] emails:0 phone:0 tokens:0</div>
                <div className="text-warning">[export] pdf=compliance-pack-123.pdf</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-success" /> JWT + role-based gates
                </div>
                <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> ETag + must-revalidate
                </div>
                <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Edge cached HTML/JS
                </div>
                <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-warning" /> Postgres + S3 + Redis
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/20 via-secondary/15 to-success/15 p-12 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="relative space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to launch your synthetic twin?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Build, evaluate, and prove compliance in hours—not quarters. Bring your own data; we bring the privacy guardrails.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                <Button size="lg" className="rounded-full px-7" asChild>
                  <AuthIntentLink href="/register" eventLocation="footer_cta" mode="register">Start for free</AuthIntentLink>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full" asChild>
                  <Link href="/contact">Book a live demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background pt-14 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-card/70 border border-border/60">
                  <Image src="/FInal_Logo.png" alt="Synth Studio Logo" width={40} height={40} className="object-contain" />
                </div>
                Synth Studio
              </div>
              <p className="text-muted-foreground max-w-md text-sm">
                The privacy-native synthetic data platform for regulated teams. Built on FastAPI, Celery, Postgres, and an aggressively cached edge.
              </p>
              <div className="flex gap-4 text-muted-foreground">
                <Link href="https://twitter.com" className="hover:text-foreground" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </Link>
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
                  <Link href="/dashboard" className="hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/generators" className="hover:text-foreground">
                    Generators
                  </Link>
                </li>
                <li>
                  <Link href="/evaluations" className="hover:text-foreground">
                    Evaluations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="/compliance" className="hover:text-foreground">
                    Compliance
                  </Link>
                </li>
                <li>
                  <Link href="/roadmap" className="hover:text-foreground">
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/billing" className="hover:text-foreground">
                    Billing
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/60 pt-6 text-sm text-muted-foreground flex flex-col md:flex-row justify-between gap-3">
            <span>© 2025 Synth Studio. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
