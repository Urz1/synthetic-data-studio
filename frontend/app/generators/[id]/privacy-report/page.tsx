"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Download, FileText, AlertCircle, CheckCircle, Info, Loader2, Sparkles, FileDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Generator } from "@/lib/types"

export default function PrivacyReportPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const generatorId = params?.id as string

  const [generator, setGenerator] = React.useState<Generator | null>(null)
  const [privacyReport, setPrivacyReport] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!generatorId) return
    loadGeneratorAndReport()
  }, [generatorId])

  async function loadGeneratorAndReport() {
    try {
      setLoading(true)
      setError(null)
      
      // Load generator details
      const gen = await api.getGenerator(generatorId)
      setGenerator(gen)

      // Try to generate privacy report if we have dataset_id
      if (gen.output_dataset_id) {
        await generateReport(gen.output_dataset_id, generatorId)
      } else {
        setError("No output dataset available for privacy analysis")
      }
    } catch (err) {
      console.error("Failed to load generator:", err)
      setError(err instanceof Error ? err.message : "Failed to load privacy report")
    } finally {
      setLoading(false)
    }
  }

  async function generateReport(datasetId: string, genId: string) {
    try {
      setGenerating(true)
      
      // Try to get cached version from S3 first
      const cached = await api.getPrivacyReportCached(genId)
      
      if (cached.cached) {
        // Cached version exists in S3, use it
        toast({
          title: "Privacy Report Loaded",
          description: "Loaded from S3 cache",
        })
        // The cached response contains download_url, not the actual report data
        // We need to generate it fresh if we need the JSON data for display
        const report = await api.generatePrivacyReportJSON(datasetId, genId)
        if (!report || Object.keys(report).length === 0) {
          throw new Error("LLM service returned empty report. Please check backend LLM configuration.")
        }
        setPrivacyReport(report)
      } else {
        // No cached version, use freshly generated one
        const report = cached.report ? cached : await api.generatePrivacyReportJSON(datasetId, genId)
        
        if (!report || Object.keys(report).length === 0) {
          throw new Error("LLM service returned empty report. Please check backend LLM configuration.")
        }
        
        setPrivacyReport(report)
        toast({
          title: "Report Generated",
          description: "Privacy report has been generated successfully",
        })
      }
    } catch (err) {
      console.error("Failed to generate privacy report:", err)
      const errorMsg = err instanceof Error ? err.message : "Failed to generate privacy report"
      setError(errorMsg)
      toast({
        title: "LLM Service Unavailable",
        description: "Privacy reports require LLM integration. This is a premium feature that needs additional setup.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleExportPDF() {
    if (!generator?.output_dataset_id) {
      toast({
        title: "Error",
        description: "No dataset available for export",
        variant: "destructive",
      })
      return
    }

    try {
      setExporting(true)
      const result = await api.exportPrivacyReport(
        generator.output_dataset_id,
        generatorId,
        "pdf",
        true
      )
      
      // Open download URL
      if (result.download_url) {
        window.open(result.download_url, '_blank')
        toast({
          title: "Export Started",
          description: "Privacy report PDF is being downloaded",
        })
      }
    } catch (err) {
      console.error("Failed to export:", err)
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export privacy report. Please ensure backend LLM service is configured.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

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

  // Loading state
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

  // Error state
  if (error && !privacyReport) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Privacy report generation failed. Please ensure:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Backend server is running</li>
              <li>LLM service is configured</li>
              <li>Generator has completed data generation</li>
            </ul>
            <Button onClick={() => router.push(`/generators/${generatorId}`)}>
              Back to Generator
            </Button>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  const report = privacyReport

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Privacy Report"
          description={`AI-powered privacy analysis ${generator ? `for ${generator.name}` : ''}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/generators/${generatorId}`}>Back to Generator</Link>
              </Button>
              <Button onClick={handleExportPDF} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
              <Button onClick={() => generateReport(generator?.output_dataset_id || "", generatorId)} disabled={generating || !generator?.output_dataset_id}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Regenerate
              </Button>
            </div>
          }
        />

        {generating && (
          <Alert className="mb-4">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Generating AI-powered privacy analysis...
            </AlertDescription>
          </Alert>
        )}

        {/* Header Summary */}
        {(generator?.name || report?.generator_name || generator?.type || report?.privacy_mechanism) && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  {(generator?.name || report?.generator_name) && (
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {generator?.name || report.generator_name}
                    </CardTitle>
                  )}
                  {(generator?.type || report?.privacy_mechanism) && (
                    <CardDescription>
                      Privacy Mechanism: {generator?.type || report.privacy_mechanism}
                    </CardDescription>
                  )}
                </div>
                {report?.privacy_metrics?.overall_privacy_score && (
                  <Badge variant="default" className="text-base px-4 py-2">
                    Privacy Score: {(report.privacy_metrics.overall_privacy_score * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        )}

        <Tabs defaultValue="budget" className="space-y-6">
          <TabsList>
            <TabsTrigger value="budget">Privacy Budget</TabsTrigger>
            <TabsTrigger value="metrics">Privacy Metrics</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Privacy Budget Tab */}
          {report?.privacy_budget && (report.privacy_budget.target_epsilon || report.privacy_budget.target_delta) && (
            <TabsContent value="budget" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {report.privacy_budget.target_epsilon && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Epsilon (ε) Budget</CardTitle>
                      <CardDescription>Privacy loss parameter</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {report.privacy_budget.target_epsilon && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target</span>
                            <span className="font-mono">{report.privacy_budget.target_epsilon}</span>
                          </div>
                        )}
                        {report.privacy_budget.spent_epsilon !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Spent</span>
                            <span className="font-mono font-semibold">{report.privacy_budget.spent_epsilon}</span>
                          </div>
                        )}
                        {report.privacy_budget.remaining_epsilon !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-mono text-green-500">{report.privacy_budget.remaining_epsilon}</span>
                          </div>
                        )}
                      </div>
                      {report.privacy_budget.budget_utilization !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Budget Utilization</span>
                            <span>{report.privacy_budget.budget_utilization}%</span>
                          </div>
                          <Progress value={report.privacy_budget.budget_utilization} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {report.privacy_budget.target_delta && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Delta (δ) Budget</CardTitle>
                      <CardDescription>Probability of privacy failure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-mono text-xs">{report.privacy_budget.target_delta.toExponential(1)}</span>
                        </div>
                        {report.privacy_budget.spent_delta && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Spent</span>
                            <span className="font-mono text-xs font-semibold">{report.privacy_budget.spent_delta.toExponential(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          Lower delta = stronger privacy guarantee. Your δ &lt; 1e-5 provides strong protection.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {/* Privacy Metrics Tab */}
          {report?.privacy_metrics && (report.privacy_metrics.k_anonymity || report.privacy_metrics.l_diversity || report.privacy_metrics.t_closeness !== undefined || report.privacy_metrics.differential_privacy_guarantee !== undefined) && (
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {report.privacy_metrics.k_anonymity && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">K-Anonymity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{report.privacy_metrics.k_anonymity}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Min group size for re-identification
                      </p>
                    </CardContent>
                  </Card>
                )}

                {report.privacy_metrics.l_diversity && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">L-Diversity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{report.privacy_metrics.l_diversity}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sensitive attribute diversity
                      </p>
                    </CardContent>
                  </Card>
                )}

                {report.privacy_metrics.t_closeness !== undefined && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">T-Closeness</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{report.privacy_metrics.t_closeness.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Distribution distance threshold
                      </p>
                    </CardContent>
                  </Card>
                )}

                {report.privacy_metrics.differential_privacy_guarantee !== undefined && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">DP Guarantee</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-500">
                        {report.privacy_metrics.differential_privacy_guarantee ? "✓" : "✗"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Differential privacy maintained
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {/* Risk Assessment Tab */}
          {report?.risk_assessment && Object.keys(report.risk_assessment).length > 0 && (
            <TabsContent value="risk" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Analysis</CardTitle>
                  <CardDescription>Assessment of privacy risks for this synthetic dataset</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(report.risk_assessment).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium">
                        {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <Badge variant={value === "Very Low" || value === "Low" ? "default" : "destructive"}>
                        <span className={getRiskColor(value as string)}>{value as string}</span>
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Recommendations Tab */}
          {report?.recommendations && report.recommendations.length > 0 && (
            <TabsContent value="recommendations" className="space-y-4">
              {report.recommendations.map((rec: any, idx: number) => (
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
          )}
        </Tabs>

        {/* Technical Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Report Generated</span>
              <span>{report?.generated_at ? new Date(report.generated_at).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Generator ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{report?.generator_id}</code>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
