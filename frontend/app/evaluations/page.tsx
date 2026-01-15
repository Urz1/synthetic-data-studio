"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BarChart3, Brain, Shield, Clock } from "lucide-react"
import ProtectedRoute from "@/components/layout/protected-route"

export default function EvaluationsPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Evaluations"
          description="Advanced quality assessment for your synthetic data"
        />

        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-2xl w-full border-2">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <CardTitle className="text-3xl">Coming Soon</CardTitle>
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                </div>
                <CardDescription className="text-base">
                  Advanced evaluation features are under development and will be announced soon
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-center">What to Expect</h3>
                
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Statistical Similarity</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Compare distributions, correlations, and statistical properties between real and synthetic data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="rounded-md bg-success/10 p-2 mt-0.5">
                      <Brain className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">ML Utility Testing</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Train models on synthetic data and compare performance against real data baselines
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="rounded-md bg-warning/10 p-2 mt-0.5">
                      <Shield className="h-4 w-4 text-warning-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Privacy Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Run privacy attack simulations including membership inference and attribute disclosure tests
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Stay tuned for updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
