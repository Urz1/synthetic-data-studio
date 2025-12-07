"use client"
import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Loader2, Database, Zap, BarChart3, Brain, Shield, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Evaluation, Generator, Dataset } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params?.id as string

  // State
  const [evaluation, setEvaluation] = React.useState<Evaluation | null>(null)
  const [generator, setGenerator] = React.useState<Generator | null>(null)
  const [dataset, setDataset] = React.useState<Dataset | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()
  const [loadingImprovements, setLoadingImprovements] = React.useState(false)
  const [improvements, setImprovements] = React.useState<any>(null)

  // Load data
  React.useEffect(() => {
    if (!id) return
    loadEvaluationDetails()

    // Poll for updates if running
    const interval = setInterval(() => {
        if (evaluation && (evaluation.status === "running" || evaluation.status === "pending")) {
            loadEvaluationDetails(true) // silent refresh
        }
    }, 3000)

    return () => clearInterval(interval)
  }, [id, evaluation?.status])

  async function loadEvaluationDetails(silent = false) {
    try {
      if (!silent) setLoading(true)
      setError(null)

      // OPTIMIZED: Single API call for evaluation + generator + dataset
      const data = await api.getEvaluationDetails(id)
      
      setEvaluation(data.evaluation)
      setGenerator(data.generator)
      setDataset(data.dataset)
    } catch (err) {
      console.error("Failed to load evaluation:", err)
      setError(err instanceof Error ? err.message : "Failed to load evaluation")
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      const dataStr = JSON.stringify(evaluation?.report, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `evaluation-${id.slice(0, 8)}-report.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export Started",
        description: "Report has been downloaded as JSON.",
      })
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export report",
        variant: "destructive",
      })
    }
  }

  async function handleSuggestImprovements() {
    try {
      setLoadingImprovements(true)
      const result = await api.suggestImprovements(id)
      
      if (!result || !result.suggestions || result.suggestions.length === 0) {
        throw new Error("No suggestions generated. LLM service may not be configured.")
      }
      
      setImprovements(result)
      toast({
        title: "Improvements Generated",
        description: `Generated ${result.suggestions?.length || 0} AI-powered suggestions`,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate improvements"
      toast({
        title: "LLM Service Unavailable",
        description: "AI improvements require LLM integration. This is a premium feature that needs additional setup.",
        variant: "destructive",
      })
    } finally {
      setLoadingImprovements(false)
    }
  }

  async function handleDelete() {
    try {
      await api.deleteEvaluation(id)
      toast({
        title: "Deleted",
        description: "Evaluation has been deleted successfully.",
      })
      router.push("/evaluations")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete evaluation",
        variant: "destructive",
      })
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
  if (error || !evaluation) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || "Evaluation not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/evaluations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evaluations
          </Button>
        </AppShell>
      </ProtectedRoute>
    )
  }

  const report = evaluation.report
  const qualityScore = report?.overall_assessment?.overall_score || 0

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/evaluations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Evaluations
            </Link>
          </Button>
        </div>

        <PageHeader
          title={`Evaluation ${evaluation.id.slice(0, 8)}`}
          description={`Quality assessment • Created ${evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown'}`}
          actions={
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSuggestImprovements}
                disabled={loadingImprovements}
              >
                {loadingImprovements ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="mr-2 h-4 w-4" />
                )}
                AI Improvements
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Quality Score */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Quality Score</CardTitle>
                <CardDescription>Comprehensive quality assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {qualityScore ? (qualityScore * 100).toFixed(1) + "%" : "N/A"}
                  </div>
                  {qualityScore > 0 && (
                    <Badge variant={qualityScore > 0.8 ? "default" : qualityScore > 0.6 ? "secondary" : "destructive"}>
                      {qualityScore > 0.8 ? "Excellent" : qualityScore > 0.6 ? "Good" : "Needs Improvement"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

             {/* Metrics Breakdown */}
             {report?.evaluations ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Statistical */}
                    {report.evaluations.statistical_similarity && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary"/> Statistical
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {((report.overall_assessment?.dimension_scores?.statistical || 0) * 100).toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Distribution similarity
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* ML Utility */}
                    {report.evaluations.ml_utility && (
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-success"/> ML Utility
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {((report.overall_assessment?.dimension_scores?.ml_utility || 0) * 100).toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Model performance
                                </p>
                            </CardContent>
                        </Card>
                    )}

                     {/* Privacy */}
                     {report.evaluations.privacy && (
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-warning-foreground"/> Privacy
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {((report.overall_assessment?.dimension_scores?.privacy || 0) * 100).toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Resistance to attacks
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
             ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Processing Results...</CardTitle>
                        <CardDescription>Metrics are being calculated.</CardDescription>
                    </CardHeader>
                </Card>
             )}

            {/* AI Improvement Suggestions */}
            {improvements && improvements.suggestions && improvements.suggestions.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI-Powered Improvement Suggestions
                  </CardTitle>
                  <CardDescription>
                    {improvements.count || improvements.suggestions.length} suggestions to enhance data quality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {improvements.suggestions.map((suggestion: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{suggestion.area || `Suggestion ${idx + 1}`}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.suggestion || suggestion.message}
                            </p>
                            {suggestion.implementation && (
                              <div className="bg-muted p-2 rounded text-xs mt-2">
                                <span className="font-medium">Implementation: </span>
                                {suggestion.implementation}
                              </div>
                            )}
                          </div>
                          {suggestion.current_value !== undefined && suggestion.target_value !== undefined && (
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Current</div>
                              <div className="text-sm font-medium">{(suggestion.current_value * 100).toFixed(1)}%</div>
                              <div className="text-xs text-muted-foreground mt-1">Target</div>
                              <div className="text-sm font-medium text-primary">{(suggestion.target_value * 100).toFixed(1)}%</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed JSON Report (Fallback/Debug) */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Report Data</CardTitle>
                <CardDescription>Raw evaluation metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                    <pre className="text-xs font-mono">
                        {JSON.stringify(report, null, 2)}
                    </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Related Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generator</CardTitle>
              </CardHeader>
              <CardContent>
                {generator ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/generators/${generator.id}`} className="text-sm text-primary hover:underline">
                        {generator.name}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Type: {generator.type}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown generator</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dataset</CardTitle>
              </CardHeader>
              <CardContent>
                {dataset ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/datasets/${dataset.id}`} className="text-sm text-primary hover:underline">
                        {dataset.name}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dataset.row_count?.toLocaleString() || 0} rows
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown dataset</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluation Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <code className="text-xs">{evaluation.id.slice(0, 12)}...</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Evaluation
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this evaluation? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
