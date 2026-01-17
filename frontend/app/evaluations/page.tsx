"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Sparkles, 
  BarChart3, 
  Brain, 
  Shield, 
  Activity,
  Zap,
  CheckCircle2,
  CircleDashed,
  BookOpen
} from "lucide-react"
import ProtectedRoute from "@/components/layout/protected-route"

export default function EvaluationsPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        <div className="space-y-8 pb-10">
          <PageHeader
            title="Evaluations"
            description="Advanced quality assessment metrics for your synthetic data pipelines."
          />

          <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
            
            {/* Left Column: Hero & Status */}
            <div className="lg:col-span-2 flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="w-fit px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                  <Sparkles className="mr-2 h-3 w-3" />
                  Coming Q4 2026
                </Badge>
                <h2 className="text-4xl font-bold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                  Data quality, <br /> quantified.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stop guessing. We are building a comprehensive suite of evaluation tools to mathematically prove the utility and privacy of your synthetic datasets.
                </p>
                
                <div className="pt-2">
                    <Button variant="outline" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        <a href="https://docs.synthdata.studio/docs/user-guide/evaluating-quality" target="_blank" rel="noopener noreferrer"> Read Methodology </a>
                    </Button>
                </div>
              </div>

              {/* Status Section (Replaces Email) */}
              <Card className="border-muted bg-background/50 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Development Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-muted-foreground">
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                            Core Metrics Engine
                        </span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Complete</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center font-medium">
                            <CircleDashed className="mr-2 h-4 w-4 text-blue-500 animate-spin-slow" />
                            Visualization UI
                        </span>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">In Progress</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-muted-foreground/50">
                            <CircleDashed className="mr-2 h-4 w-4" />
                            PDF Reporting
                        </span>
                        <span className="text-xs text-muted-foreground/50">Pending</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Completion</span>
                        <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Feature Preview Grid */}
            <div className="lg:col-span-3 grid gap-6 md:grid-cols-2">
              
              {/* Feature 1: Statistical */}
              <Card className="group relative overflow-hidden border-muted transition-all hover:border-primary/50 hover:shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BarChart3 className="h-24 w-24 -mr-4 -mt-4 text-primary" />
                </div>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Statistical Fidelity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automated comparison of distributions, correlations, and multivariate properties between real and synthetic datasets.
                  </p>
                  <ul className="text-xs space-y-2 text-muted-foreground/80">
                    <li className="flex items-center"><Zap className="h-3 w-3 mr-2 text-blue-500"/> JS Divergence & KS Tests</li>
                    <li className="flex items-center"><Zap className="h-3 w-3 mr-2 text-blue-500"/> Correlation Matrix Heatmaps</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 2: ML Utility */}
              <Card className="group relative overflow-hidden border-muted transition-all hover:border-primary/50 hover:shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Brain className="h-24 w-24 -mr-4 -mt-4 text-primary" />
                </div>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400">
                    <Brain className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Downstream Utility</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Train-Synthetic-Test-Real (TSTR) evaluation pipeline to verify model performance retention.
                  </p>
                  <ul className="text-xs space-y-2 text-muted-foreground/80">
                    <li className="flex items-center"><Zap className="h-3 w-3 mr-2 text-emerald-500"/> XGBoost & RF Benchmarks</li>
                    <li className="flex items-center"><Zap className="h-3 w-3 mr-2 text-emerald-500"/> F1-Score & Accuracy Delta</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 3: Privacy */}
              <Card className="md:col-span-2 group relative overflow-hidden border-muted transition-all hover:border-primary/50 hover:shadow-md bg-gradient-to-br from-background to-muted/30">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="h-32 w-32 -mr-8 -mt-8 text-primary" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 p-6">
                  <div className="space-y-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">Privacy Assurance</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Rigorous adversarial attacks to ensure your synthetic data does not leak PII or overfit to the original training data.
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 border-l pl-0 md:pl-6 pt-4 md:pt-0 border-dashed border-muted-foreground/20 flex flex-col justify-center space-y-3">
                    <div className="flex items-center justify-between text-sm bg-background/80 p-2 rounded border shadow-sm">
                      <span>Distance to Closest Record</span>
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-background/80 p-2 rounded border shadow-sm">
                      <span>Membership Inference</span>
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-background/80 p-2 rounded border shadow-sm">
                      <span>Attribute Disclosure</span>
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}