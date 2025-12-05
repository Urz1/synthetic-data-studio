"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowLeft, RefreshCw, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock explanation data
const mockExplanation = {
  evaluation_id: "eval-123",
  dataset_name: "Synthetic Patient Data V1",
  overall_score: 0.88,
  summary: "The synthetic dataset demonstrates high fidelity to the original data, with strong statistical similarity (KS-Test: 0.92). Privacy guarantees are robust (ε=8.2), though there is a slight trade-off in correlation retention for complex feature interactions.",
  key_insights: [
    {
      title: "Strong Distribution Matching",
      description: "Univariate distributions for 'age', 'income', and 'diagnosis' match the original data with >95% accuracy.",
      sentiment: "positive"
    },
    {
      title: "Privacy-Utility Balance",
      description: "The model successfully suppresses outliers while maintaining general trends, effectively mitigating re-identification risks.",
      sentiment: "positive"
    },
    {
      title: "Correlation Drift",
      description: "Correlations between 'medication' and 'side_effects' are weaker in the synthetic data (0.65 vs 0.82 original). This is expected due to the differential privacy noise injection.",
      sentiment: "neutral"
    }
  ],
  recommendations: [
    "Consider increasing the training epochs to improve correlation capture.",
    "If privacy budget allows, relax the epsilon constraint slightly to 9.0 for better utility.",
    "Validate the downstream ML performance on a specific classification task."
  ]
}

export default function EvaluationExplainPage() {
  const { user } = useAuth()
  const params = useParams()
  const evaluationId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [explanation, setExplanation] = useState<typeof mockExplanation | null>(null)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setExplanation(mockExplanation)
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleRegenerate = () => {
    setLoading(true)
    setExplanation(null)
    setTimeout(() => {
      setExplanation(mockExplanation)
      setLoading(false)
    }, 2000)
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
              <Button onClick={handleRegenerate} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Regenerate Analysis
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader className="h-32 bg-muted/50" />
              <CardContent className="h-48 bg-muted/20" />
            </Card>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted/50" />
                  <CardContent className="h-32 bg-muted/20" />
                </Card>
              ))}
            </div>
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
                <p className="text-lg leading-relaxed">{explanation.summary}</p>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <div className="grid md:grid-cols-3 gap-6">
              {explanation.key_insights.map((insight, idx) => (
                <Card key={idx} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={insight.sentiment === "positive" ? "default" : "secondary"}>
                        {insight.sentiment === "positive" ? "Strength" : "Observation"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable steps to improve future generations</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {explanation.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm pt-1.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feedback */}
            <div className="flex justify-center gap-4 pt-4">
              <span className="text-sm text-muted-foreground self-center">Was this explanation helpful?</span>
              <Button variant="outline" size="sm" className="gap-2">
                <ThumbsUp className="h-4 w-4" /> Yes
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ThumbsDown className="h-4 w-4" /> No
              </Button>
            </div>
          </div>
        ) : null}
      </AppShell>
    </ProtectedRoute>
  )
}
