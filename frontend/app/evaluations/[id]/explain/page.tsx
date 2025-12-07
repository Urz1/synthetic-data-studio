"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowLeft, RefreshCw, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"
import { api } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface Explanation {
  evaluation_id: string
  explanation?: string
  key_findings?: string[]
  concerns?: string[]
  recommendations?: string[]
  _metadata?: {
    provider: string
    model: string
    tokens_used: number
  }
}

export default function EvaluationExplainPage() {
  const { user } = useAuth()
  const params = useParams()
  const evaluationId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (evaluationId) {
      loadExplanation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId])

  async function loadExplanation() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.explainEvaluation(evaluationId)
      setExplanation(data as Explanation)
    } catch (err) {
      console.error("Failed to load explanation:", err)
      setError(err instanceof Error ? err.message : "Failed to load explanation")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    try {
      setGenerating(true)
      setError(null)
      const data = await api.explainEvaluation(evaluationId)
      setExplanation(data as Explanation)
      toast({
        title: "Analysis Regenerated",
        description: "New insights have been generated.",
      })
    } catch (err) {
      toast({
        title: "Regeneration Failed",
        description: err instanceof Error ? err.message : "Failed to regenerate analysis",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="AI Evaluation Analysis"
          description={`LLM-powered insights for evaluation #${evaluationId}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/evaluations/${evaluationId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Evaluation
                </Link>
              </Button>
              <Button onClick={handleRegenerate} disabled={loading || generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Analysis
                  </>
                )}
              </Button>
            </div>
          }
        />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : explanation ? (
          <div className="space-y-6">
            {/* Executive Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{explanation.explanation || "No explanation available"}</p>
              </CardContent>
            </Card>

            {/* Key Findings */}
            {explanation.key_findings && explanation.key_findings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                  <CardDescription>Important observations from the evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {explanation.key_findings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        </div>
                        <span className="text-sm pt-0.5">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Concerns */}
            {explanation.concerns && explanation.concerns.length > 0 && (
              <Card className="border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-5 w-5" />
                    Concerns
                  </CardTitle>
                  <CardDescription>Areas that may need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {explanation.concerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-yellow-500/10 p-1.5 rounded-full mt-0.5">
                          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                        </div>
                        <span className="text-sm pt-0.5">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {explanation.recommendations && explanation.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Actionable steps to improve future generations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {explanation.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-green-500/10 p-1.5 rounded-full mt-0.5">
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                        </div>
                        <span className="text-sm pt-0.5">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {explanation._metadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Analysis Metadata</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>Provider: {explanation._metadata.provider}</div>
                  <div>Model: {explanation._metadata.model}</div>
                  <div>Tokens Used: {explanation._metadata.tokens_used?.toLocaleString()}</div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </AppShell>
    </ProtectedRoute>
  )
}
