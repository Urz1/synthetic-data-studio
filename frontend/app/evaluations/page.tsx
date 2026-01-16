"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  FileSearch, 
  Layers,
  Construction
} from "lucide-react"
import ProtectedRoute from "@/components/layout/protected-route"

export default function EvaluationsPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <div className="max-w-5xl mx-auto">
          <PageHeader
            title="Evaluations"
            description="Framework for quantifying synthetic data fidelity, utility, and privacy risk."
          />
          <div className="mt-3">
            <Badge variant="secondary" className="rounded-md px-2 py-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 inline-flex items-center">
              <Construction className="h-3 w-3 mr-1.5" />
              Under Development
            </Badge>
          </div>

          <div className="grid gap-8 mt-10">
            {/* Status Section */}
            <section className="rounded-xl border bg-card p-8 flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Quality Assurance Framework</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our evaluation engine is being engineered to provide mathematically rigorous comparisons between 
                  source distributions and generated outputs. This module will integrate directly with your 
                  generation pipeline to provide automated validation reports.
                </p>
              </div>
              <div className="w-full md:w-72 space-y-3">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Development Phase</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm italic text-muted-foreground">
                    <span>Algorithm Design</span>
                    <span>40%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[40%]" />
                  </div>
                  <div className="flex justify-between text-sm italic text-muted-foreground pt-1">
                    <span>Backend Integration</span>
                    <span>30%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[30%]" />
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Feature Pipeline */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg border bg-background flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Fidelity Analysis</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Automated scoring of marginal distributions, correlation stability, and statistical distance metrics.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg border bg-background flex items-center justify-center shadow-sm">
                  <Layers className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Downstream Utility</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Benchmarking synthetic data against real-world ML tasks to ensure model performance parity.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg border bg-background flex items-center justify-center shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Privacy Auditing</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Empirical testing for attribute disclosure and membership inference to verify anonymization strength.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Methodology Note */}
            <div className="mt-12 rounded-lg bg-muted/40 border border-dashed p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileSearch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold uppercase tracking-tight">Methodology</span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Our evaluation suite is based on the latest research in privacy-preserving data synthesis. 
                We prioritize objective metrics over heuristic visualizations to provide defensible data quality evidence.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}