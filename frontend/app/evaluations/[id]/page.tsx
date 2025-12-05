"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EvaluationMetricsGrid } from "@/components/evaluations/evaluation-metrics-grid"
import { RiskAssessmentPanel } from "@/components/evaluations/risk-assessment-panel"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Download, Sparkles, RefreshCw } from "lucide-react"
import type { Evaluation, RiskAssessment } from "@/lib/types"

// Mock data
const mockEvaluation: Evaluation = {
  id: "e1",
  generator_id: "g1",
  dataset_id: "d1",
  status: "completed",
  report: {
    statistical_similarity: {
      overall_score: 0.92,
      column_scores: {
        age: { ks_statistic: 0.05, p_value: 0.87 },
        gender: { chi2_statistic: 1.2, p_value: 0.55 },
      },
      correlation_difference: 0.03,
    },
    ml_utility: {
      train_on_synthetic_test_on_real: { accuracy: 0.84, f1: 0.82 },
      train_on_real_test_on_real: { accuracy: 0.87, f1: 0.85 },
      utility_preservation: 0.96,
    },
    privacy: {
      membership_inference_auc: 0.52,
      attribute_inference_accuracy: 0.48,
      nearest_neighbor_distance: { min: 2.3, mean: 15.7, std: 8.2 },
      privacy_risk: "low",
    },
    overall_quality_score: 0.89,
    recommendations: [
      "High quality synthetic data suitable for analytics",
      "Privacy metrics indicate low re-identification risk",
    ],
  },
  created_at: "2024-12-14T10:00:00Z",
}

const mockRiskAssessment: RiskAssessment = {
  evaluation_id: "e1",
  risk_level: "low",
  risk_score: 0.15,
  risk_factors: {
    re_identification_risk: {
      level: "low",
      score: 0.12,
      details: "Nearest neighbor distance analysis shows adequate separation",
    },
    attribute_disclosure_risk: {
      level: "low",
      score: 0.18,
      details: "Sensitive attributes cannot be reliably inferred",
    },
    membership_inference_risk: {
      level: "low",
      score: 0.08,
      details: "Attack AUC of 0.52 indicates near-random guessing",
    },
  },
  compliance: {
    hipaa_suitable: true,
    gdpr_suitable: true,
    notes: "Differential privacy guarantees meet regulatory standards",
  },
  recommendations: ["Synthetic data suitable for external sharing", "No additional privacy measures required"],
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const evaluation = mockEvaluation // In production, fetch based on params.id

  return (
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
        title="Evaluation Results"
        description={`Completed on ${new Date(evaluation.created_at).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-run
            </Button>
            <Button variant="outline" size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Explain
            </Button>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Grid */}
          {evaluation.report && <EvaluationMetricsGrid report={evaluation.report} />}

          {/* Recommendations */}
          {evaluation.report?.recommendations && evaluation.report.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
                <CardDescription>Based on evaluation results</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.report.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-success">•</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Evaluation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluation Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={evaluation.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Generator</span>
                <Link href={`/generators/${evaluation.generator_id}`} className="text-sm text-primary hover:underline">
                  View Generator
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dataset</span>
                <Link href={`/datasets/${evaluation.dataset_id}`} className="text-sm text-primary hover:underline">
                  View Dataset
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <RiskAssessmentPanel assessment={mockRiskAssessment} />
        </div>
      </div>
    </AppShell>
  )
}
