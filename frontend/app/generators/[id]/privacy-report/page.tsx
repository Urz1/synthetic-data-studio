"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Download, FileText, AlertCircle, CheckCircle, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock privacy report data
const mockPrivacyReport = {
  generator_id: "gen-123",
  generator_name: "Patient Records Generator",
  privacy_mechanism: "Differential Privacy (DP-CTGAN)",
  privacy_budget: {
    target_epsilon: 8.5,
    target_delta: 1e-5,
    spent_epsilon: 8.2,
    spent_delta: 9.5e-6,
    remaining_epsilon: 0.3,
    budget_utilization: 96.5,
  },
  privacy_metrics: {
    overall_privacy_score: 0.87,
    k_anonymity: 7,
    l_diversity: 4,
    t_closeness: 0.12,
    differential_privacy_guarantee: true,
  },
  risk_assessment: {
    reidentification_risk: "Low",
    attribute_disclosure_risk: "Very Low",
    membership_inference_risk: "Low",
    overall_risk_level: "Low",
  },
  recommendations: [
    {
      category: "Budget Management",
      message: "96.5% of privacy budget used. Consider increasing epsilon if you need more generations.",
      severity: "info",
    },
    {
      category: "Privacy Guarantee",
      message: "Strong differential privacy guarantee maintained (ε=8.2, δ=9.5e-6)",
      severity: "success",
    },
    {
      category: "Data Quality",
      message: "K-anonymity of 7 exceeds minimum threshold of 5 for healthcare data",
      severity: "success",
    },
  ],
  generated_at: "2024-12-03T14:30:00Z",
}

export default function PrivacyReportPage() {
  const { user } = useAuth()
  const params = useParams()
  const generatorId = params?.id as string

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "very low":
        return "text-green-500"
      case "low":
        return "text-blue-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-orange-500"
      case "very high":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Privacy Report"
          description={`Differential privacy analysis for ${mockPrivacyReport.generator_name}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/generators/${generatorId}`}>Back to Generator</Link>
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          }
        />

        {/* Header Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {mockPrivacyReport.generator_name}
                </CardTitle>
                <CardDescription>
                  Privacy Mechanism: {mockPrivacyReport.privacy_mechanism}
                </CardDescription>
              </div>
              <Badge variant="default" className="text-base px-4 py-2">
                Privacy Score: {(mockPrivacyReport.privacy_metrics.overall_privacy_score * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="budget" className="space-y-6">
          <TabsList>
            <TabsTrigger value="budget">Privacy Budget</TabsTrigger>
            <TabsTrigger value="metrics">Privacy Metrics</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Privacy Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Epsilon (ε) Budget</CardTitle>
                  <CardDescription>Privacy loss parameter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-mono">{mockPrivacyReport.privacy_budget.target_epsilon}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-mono font-semibold">{mockPrivacyReport.privacy_budget.spent_epsilon}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-mono text-green-500">{mockPrivacyReport.privacy_budget.remaining_epsilon}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Budget Utilization</span>
                      <span>{mockPrivacyReport.privacy_budget.budget_utilization}%</span>
                    </div>
                    <Progress value={mockPrivacyReport.privacy_budget.budget_utilization} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Delta (δ) Budget</CardTitle>
                  <CardDescription>Probability of privacy failure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-mono text-xs">{mockPrivacyReport.privacy_budget.target_delta.toExponential(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-mono text-xs font-semibold">{mockPrivacyReport.privacy_budget.spent_delta.toExponential(1)}</span>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Lower delta = stronger privacy guarantee. Your δ &lt; 1e-5 provides strong protection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privacy Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">K-Anonymity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{mockPrivacyReport.privacy_metrics.k_anonymity}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min group size for re-identification
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">L-Diversity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{mockPrivacyReport.privacy_metrics.l_diversity}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sensitive attribute diversity
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">T-Closeness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{mockPrivacyReport.privacy_metrics.t_closeness.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Distribution distance threshold
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">DP Guarantee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {mockPrivacyReport.privacy_metrics.differential_privacy_guarantee ? "✓" : "✗"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Differential privacy maintained
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Assessment Tab */}
          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
                <CardDescription>Assessment of privacy risks for this synthetic dataset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(mockPrivacyReport.risk_assessment).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">
                      {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <Badge variant={value === "Very Low" || value === "Low" ? "default" : "destructive"}>
                      <span className={getRiskColor(value)}>{value}</span>
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {mockPrivacyReport.recommendations.map((rec, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {getSeverityIcon(rec.severity)}
                    {rec.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{rec.message}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Technical Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Report Generated</span>
              <span>{new Date(mockPrivacyReport.generated_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Generator ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{mockPrivacyReport.generator_id}</code>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
