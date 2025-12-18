"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Shield, CheckCircle2, AlertCircle, Download, ArrowRight, Lock, Loader2, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"
import { api } from "@/lib/api"
import type { RiskAssessment } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface OldMockRiskData {
  evaluation_id: "eval-123",
  dataset_name: "Synthetic Patient Data V1",
  overall_risk_score: 12, // 0-100, lower is better
  risk_level: "Low",
  assessed_at: "2025-12-03T15:00:00Z",
  vulnerabilities: [
    {
      id: "vuln-1",
      name: "Outlier Re-identification",
      severity: "Medium",
      score: 45,
      description: "Potential for re-identifying individuals with unique attribute combinations",
      affected_records: 12,
      mitigation: "Increase k-anonymity threshold or apply additional suppression",
    },
    {
      id: "vuln-2",
      name: "Attribute Inference",
      severity: "Low",
      score: 15,
      description: "Ability to infer sensitive attributes from public attributes",
      affected_records: 5,
      mitigation: "Verify l-diversity for sensitive columns",
    },
    {
      id: "vuln-3",
      name: "Membership Inference",
      severity: "Low",
      score: 8,
      description: "Ability to determine if a record was in the training set",
      affected_records: 0,
      mitigation: "Differential privacy guarantee is sufficient (ε=8.2)",
    },
  ],
  attack_simulations: [
    {
      name: "Linkage Attack",
      success_rate: "0.02%",
      status: "Passed",
      threshold: "< 1%",
    },
    {
      name: "Singling Out",
      success_rate: "0.15%",
      status: "Passed",
      threshold: "< 0.5%",
    },
    {
      name: "Inference Attack",
      success_rate: "1.2%",
      status: "Warning",
      threshold: "< 1%",
    },
  ],
  privacy_guarantees: [
    { name: "Differential Privacy", status: "Active", details: "ε=8.2, δ=1e-5" },
    { name: "K-Anonymity", status: "Active", details: "k=7" },
    { name: "L-Diversity", status: "Active", details: "l=4" },
  ]
}

export default function RiskAssessmentPage() {
  const { user } = useAuth()
  const params = useParams()
  const evaluationId = params?.id as string
  const { toast } = useToast()

  const [riskData, setRiskData] = React.useState<RiskAssessment | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [calculating, setCalculating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (evaluationId) {
      loadRiskAssessment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId])

  async function loadRiskAssessment() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getRiskReport(evaluationId)
      setRiskData(data)
    } catch (err) {
      console.error("Failed to load risk assessment:", err)
      // If not found, offer to calculate it
      if (err instanceof Error && err.message.includes("404")) {
        setError("Risk assessment not yet calculated. Click 'Calculate Risk' to generate it.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to load risk assessment")
      }
    } finally {
      setLoading(false)
    }
  }

  async function calculateRisk() {
    try {
      setCalculating(true)
      setError(null)
      const data = await api.assessRisk(evaluationId)
      setRiskData(data)
      toast({
        title: "Risk Calculated",
        description: "Risk assessment has been generated successfully.",
      })
    } catch (err) {
      toast({
        title: "Calculation Failed",
        description: err instanceof Error ? err.message : "Failed to calculate risk",
        variant: "destructive",
      })
    } finally {
      setCalculating(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low": return "text-green-500"
      case "medium": return "text-yellow-500"
      case "high": return "text-red-500"
      case "critical": return "text-red-700"
      default: return "text-muted-foreground"
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "outline" as const,
      medium: "secondary" as const,
      high: "destructive" as const,
      critical: "destructive" as const,
    }
    return <Badge variant={variants[severity.toLowerCase() as keyof typeof variants] || "outline"}>{severity}</Badge>
  }

  const getScoreColor = (score: number) => {
    if (score < 20) return "text-green-500"
    if (score < 50) return "text-yellow-500"
    return "text-red-500"
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Risk Assessment"
          description="Comprehensive privacy and security analysis"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/evaluations/${evaluationId}`}>Back to Evaluation</Link>
              </Button>
              {riskData && (
                <Button onClick={calculateRisk} disabled={calculating}>
                  {calculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recalculating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recalculate
                    </>
                  )}
                </Button>
              )}
              {!riskData && (
                <Button onClick={calculateRisk} disabled={calculating}>
                  {calculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Calculate Risk
                    </>
                  )}
                </Button>
              )}
            </div>
          }
        />

        {error && (
          <Alert variant="default" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!riskData ? (
          <Card>
            <CardHeader>
              <CardTitle>No Risk Assessment Available</CardTitle>
              <CardDescription>
                Click &quot;Calculate Risk&quot; to generate a comprehensive risk assessment for this evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={calculateRisk} disabled={calculating}>
                {calculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Calculate Risk Assessment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overall Risk Score */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Overall Risk Score</CardTitle>
                <CardDescription>Aggregate privacy risk metric</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-2">
                <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-muted">
                  <div className={`text-4xl font-bold ${getScoreColor(riskData.overall_score)}`}>
                    {riskData.overall_score?.toFixed(0) || 0}
                  </div>
                  <div className="absolute -bottom-2 bg-background px-2 text-sm font-medium text-muted-foreground">
                    / 100
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {riskData.risk_level} Risk
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {riskData.interpretation || "Risk assessment completed"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Component Risks */}
            {riskData.component_risks && Object.keys(riskData.component_risks).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Components
                  </CardTitle>
                  <CardDescription>Breakdown of different risk factors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {riskData.component_risks.map((risk) => (
                      <div key={risk.name} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{risk.name.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={risk.score} className="w-24 h-2" />
                          <span className="text-sm font-mono w-12 text-right">
                            {risk.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {riskData.recommendations && riskData.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Actions to improve privacy and reduce risk</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {riskData.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scores Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Details</CardTitle>
                <CardDescription>Comprehensive risk breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-2xl font-bold">{riskData.overall_score?.toFixed(2)}/100</p>
                  </div>
                  {riskData.privacy_score !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Privacy Score</p>
                      <p className="text-2xl font-bold">{riskData.privacy_score.toFixed(2)}</p>
                    </div>
                  )}
                  {riskData.quality_score !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Quality Score</p>
                      <p className="text-2xl font-bold">{riskData.quality_score.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {riskData.interpretation && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{riskData.interpretation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}
