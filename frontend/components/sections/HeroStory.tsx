"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Shield, FileJson, FileCheck, Lock, Download, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthIntentLink } from "@/components/auth/auth-intent-link"
import Link from "next/link"
import styles from "./HeroStory.module.css"

interface HeroStoryProps {
  theme?: "light" | "dark"
  onReplay?: () => void
}

// Scene data with plain English copy
const scenes = [
  {
    id: "privacy",
    headline: "Your data stays private",
    subtext: "We learn patterns from your data, but never copy actual records. Share synthetic data freely — it can't be traced back.",
    cta: "See how it works",
    ctaHref: "#how-it-works",
    benefits: ["Safe to share externally", "No real records exposed", "Mathematically proven"],
  },
  {
    id: "schema",
    headline: "Describe it, we build it",
    subtext: "Define your columns and types. Get realistic data in seconds — no uploads, no training, no waiting.",
    cta: "Try schema generator",
    ctaHref: "/generators/schema",
    benefits: ["Instant results", "No data upload needed", "Perfect for prototyping"],
  },
  {
    id: "reports",
    headline: "Audit-ready in one click",
    subtext: "Download a professional report proving your data is protected. Ready for compliance reviews and stakeholder sign-off.",
    cta: "View sample report",
    ctaHref: "#features",
    benefits: ["HIPAA & GDPR ready", "One-click download", "Professional PDF"],
  },
]

/**
 * Animated Hero Story Section - Side-by-Side Layout
 * Animation LEFT, Text + CTA RIGHT
 * 3 scenes × 5s = 15s per loop, loops twice, then stops.
 */
export function HeroStory({ theme = "dark", onReplay }: HeroStoryProps) {
  const [currentScene, setCurrentScene] = useState(0)
  const [loopCount, setLoopCount] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  // Scene rotation logic - 5 seconds per scene
  useEffect(() => {
    if (prefersReducedMotion || isPaused || isComplete) return

    intervalRef.current = setInterval(() => {
      setCurrentScene((prev) => {
        const next = (prev + 1) % 3
        if (next === 0) {
          setLoopCount((lc) => {
            if (lc >= 1) {
              setIsComplete(true)
              setCurrentScene(2)
              return lc
            }
            return lc + 1
          })
        }
        return next
      })
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [prefersReducedMotion, isPaused, isComplete])

  const handleReplay = useCallback(() => {
    if (isComplete || isPaused) {
      setIsComplete(false)
      setLoopCount(0)
      setCurrentScene(0)
      setIsPaused(false)
      onReplay?.()
    }
  }, [isComplete, isPaused, onReplay])

  const scene = scenes[currentScene]

  return (
    <section
      className={`${styles.heroStory} relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden`}
      role="region"
      aria-label="Synth Studio features showcase"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 top-10 h-96 w-96 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute right-[-12%] bottom-0 h-[420px] w-[420px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Open Source Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Open Source · Free to Use
          </div>
        </div>

        {/* Main Hero - Side by Side */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          
          {/* LEFT: Animation Pane */}
          <div 
            className={`${styles.animationPane} relative order-2 lg:order-1`}
            onMouseEnter={handleReplay}
          >
            <div className={`${styles.animationContainer} bg-card/50 border border-border rounded-2xl p-4 sm:p-6 md:p-8 min-h-[280px] sm:min-h-[320px] flex items-center justify-center overflow-hidden`}>
              {currentScene === 0 && <PrivacyAnimation animated={!prefersReducedMotion} />}
              {currentScene === 1 && <SchemaAnimation animated={!prefersReducedMotion} />}
              {currentScene === 2 && <ReportAnimation animated={!prefersReducedMotion} />}
            </div>

            {/* Scene indicators */}
            <div className="flex justify-center gap-3 mt-6">
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentScene(i)
                    setIsPaused(true)
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentScene 
                      ? "w-8 bg-primary" 
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`View ${s.headline}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Text + CTA Pane */}
          <div className={`${styles.textPane} order-1 lg:order-2 text-center lg:text-left`}>
            {/* Headline */}
            <h1
              key={`h-${currentScene}`}
              className={`${prefersReducedMotion ? "" : styles.slideIn} text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6`}
            >
              {scene.headline}
            </h1>

            {/* Subtext */}
            <p
              key={`p-${currentScene}`}
              className={`${prefersReducedMotion ? "" : styles.slideIn} text-lg md:text-xl text-muted-foreground mb-8`}
              style={{ animationDelay: "100ms" }}
            >
              {scene.subtext}
            </p>

            {/* Benefits list */}
            <ul className="space-y-3 mb-8">
              {scene.benefits.map((benefit, i) => (
                <li
                  key={benefit}
                  className={`${prefersReducedMotion ? "" : styles.slideIn} flex items-center gap-3 justify-center lg:justify-start text-sm`}
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div
              className={`${prefersReducedMotion ? "" : styles.slideIn} flex flex-col sm:flex-row gap-3 justify-center lg:justify-start`}
              style={{ animationDelay: "500ms" }}
            >
              <Button size="lg" className="h-12 rounded-full px-6" asChild>
                <AuthIntentLink href="/register" eventLocation="hero" mode="register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </AuthIntentLink>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-6" asChild>
                <Link href={scene.ctaHref}>
                  {scene.cta}
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6 text-center lg:text-left">
              No credit card · No setup · Works in your browser
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================
   SCENE 1: Privacy Animation
   Shows: Real data → Shield → Anonymized data
   ============================================ */
function PrivacyAnimation({ animated }: { animated: boolean }) {
  return (
    <div className="w-full px-2">
      {/* Stack vertically on mobile, horizontal on larger screens */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        {/* Real data card */}
        <div className={`${styles.dataCard} ${animated ? styles.fadeInLeft : ""} bg-background border border-border rounded-xl p-3 sm:p-4 w-full sm:w-auto sm:min-w-[130px]`}>
          <div className="text-xs font-medium text-muted-foreground mb-2">Your Data</div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex gap-2">
              <span className="text-muted-foreground">name:</span>
              <span className={`${animated ? styles.redact : ""} text-destructive`}>John Smith</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">email:</span>
              <span className={`${animated ? styles.redact : ""} text-destructive`}>john@...</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">salary:</span>
              <span>$85,000</span>
            </div>
          </div>
        </div>

        {/* Shield in middle */}
        <div className={`${styles.shieldPulse} ${animated ? styles.scaleIn : ""} relative`}>
          <div className="bg-primary/10 rounded-full p-4">
            <Shield className={`h-10 w-10 text-primary ${animated ? styles.shieldGlow : ""}`} />
          </div>
          <div className={`${animated ? styles.checkAppear : ""} absolute -bottom-1 -right-1 bg-success rounded-full p-1`}>
            <CheckCircle2 className="h-4 w-4 text-success-foreground" />
          </div>
        </div>

        {/* Synthetic data card */}
        <div className={`${styles.dataCard} ${animated ? styles.fadeInRight : ""} bg-background border border-primary/50 rounded-xl p-3 sm:p-4 w-full sm:w-auto sm:min-w-[130px]`}
             style={{ animationDelay: animated ? "800ms" : undefined }}>
          <div className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Safe to Share
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex gap-2">
              <span className="text-muted-foreground">name:</span>
              <span className="text-success">Alex Chen</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">email:</span>
              <span className="text-success">alex@...</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">salary:</span>
              <span>$82,400</span>
            </div>
          </div>
        </div>
      </div>

      <p className={`${animated ? styles.fadeInUp : ""} text-center text-sm text-muted-foreground mt-6`}
         style={{ animationDelay: "1200ms" }}>
        Real patterns preserved · Real identities protected
      </p>
    </div>
  )
}

/* ============================================
   SCENE 2: Schema Animation  
   Shows: Column definition → Instant data rows
   ============================================ */
function SchemaAnimation({ animated }: { animated: boolean }) {
  const columns = [
    { name: "age", type: "18-65" },
    { name: "city", type: "US cities" },
    { name: "salary", type: "$40k-$120k" },
  ]
  const rows = [
    { age: 32, city: "Seattle", salary: "$75,000" },
    { age: 28, city: "Austin", salary: "$62,000" },
    { age: 45, city: "Denver", salary: "$91,000" },
  ]

  return (
    <div className="w-full px-2">
      {/* Stack vertically on mobile, horizontal on larger screens */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4 sm:gap-6">
        {/* Schema definition */}
        <div className={`${styles.schemaCard} ${animated ? styles.fadeInLeft : ""} bg-background border border-border rounded-xl p-3 sm:p-4 w-full sm:w-auto sm:min-w-[150px]`}>
          <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            You describe
          </div>
          <div className="space-y-2">
            {columns.map((col, i) => (
              <div
                key={col.name}
                className={`${animated ? styles.typeLine : ""} flex items-center gap-2 text-xs`}
                style={{ animationDelay: animated ? `${i * 300}ms` : undefined }}
              >
                <span className="font-mono text-primary">{col.name}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">{col.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow - rotated on mobile */}
        <div className={`${animated ? styles.arrowPulse : ""} flex items-center py-2 sm:pt-12`}>
          <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary rotate-90 sm:rotate-0" />
        </div>

        {/* Generated rows */}
        <div className={`${styles.rowsCard} ${animated ? styles.fadeInRight : ""} bg-background border border-primary/50 rounded-xl p-3 sm:p-4 w-full sm:w-auto sm:min-w-[180px]`}
             style={{ animationDelay: animated ? "600ms" : undefined }}>
          <div className="text-xs font-medium text-primary mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            We create
          </div>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className={`${animated ? styles.printRow : ""} flex items-center gap-3 text-xs font-mono bg-muted/50 rounded px-2 py-1`}
                style={{ animationDelay: animated ? `${900 + i * 200}ms` : undefined }}
              >
                <span>{row.age}</span>
                <span className="text-muted-foreground">|</span>
                <span>{row.city}</span>
                <span className="text-muted-foreground">|</span>
                <span>{row.salary}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={`${animated ? styles.fadeInUp : ""} text-center text-sm text-muted-foreground mt-6`}
         style={{ animationDelay: "1500ms" }}>
        Seconds to generate · Thousands of rows
      </p>
    </div>
  )
}

/* ============================================
   SCENE 3: Report Animation
   Shows: PDF report with compliance badges
   ============================================ */
function ReportAnimation({ animated }: { animated: boolean }) {
  return (
    <div className="w-full px-2">
      <div className="flex justify-center">
        {/* PDF Report Card */}
        <div className={`${styles.reportCard} ${animated ? styles.cardFlip : ""} bg-background border border-border rounded-xl p-4 sm:p-6 w-full sm:w-auto sm:min-w-[280px] max-w-[320px] shadow-lg`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold">Privacy Report</span>
              </div>
              <span className="text-xs text-muted-foreground">Auto-generated documentation</span>
            </div>
            <div className={`${animated ? styles.downloadBounce : ""}`}
                 style={{ animationDelay: "1200ms" }}>
              <div className="bg-primary/10 rounded-lg p-2">
                <Download className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Content preview */}
          <div className="space-y-2 mb-4">
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted rounded w-4/5" />
            <div className="h-2 bg-muted rounded w-3/5" />
          </div>

          {/* Compliance badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`${animated ? styles.badgeDrop : ""} text-xs font-bold px-3 py-1.5 rounded-full bg-success/20 text-success border border-success/30`}
                  style={{ animationDelay: "600ms" }}>
              ✓ HIPAA Ready
            </span>
            <span className={`${animated ? styles.badgeDrop : ""} text-xs font-bold px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30`}
                  style={{ animationDelay: "800ms" }}>
              ✓ GDPR Compliant
            </span>
            <span className={`${animated ? styles.badgeDrop : ""} text-xs font-bold px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30`}
                  style={{ animationDelay: "1000ms" }}>
              ✓ SOC 2
            </span>
          </div>
        </div>
      </div>

      <p className={`${animated ? styles.fadeInUp : ""} text-center text-sm text-muted-foreground mt-6`}
         style={{ animationDelay: "1400ms" }}>
        Ready for auditors · No extra work
      </p>
    </div>
  )
}

export default HeroStory
