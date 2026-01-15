"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EvaluationScoreRing } from "./evaluation-score-ring"
import { RiskIndicator } from "@/components/ui/risk-indicator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BarChart3, Brain, Shield, HelpCircle } from "lucide-react"
import type { EvaluationReport } from "@/lib/types"

interface EvaluationMetricsGridProps {
  report: EvaluationReport
  className?: string
}

export function EvaluationMetricsGrid({ report, className }: EvaluationMetricsGridProps) {
  // Safely handle report that might be a generic object
  if (!report || typeof report !== 'object') {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No evaluation report available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check for errors in evaluations
  const evaluations = (report as any).evaluations || {}
  const hasErrors = 
    evaluations.statistical_similarity?.status === 'error' ||
    evaluations.ml_utility?.status === 'error' ||
    evaluations.privacy?.status === 'error'

  const toNumber = (value: any) => (Number.isFinite(value) ? value : undefined)
  const toRatio = (value: any) => {
    const num = toNumber(value)
    if (num === undefined) return undefined
    if (num > 1) return num / 100
    if (num < 0) return 0
    return num
  }
  const privacyLevelToScore = (level?: string) => {
    const map: Record<string, number> = {
      Excellent: 1,
      Good: 1,
      Fair: 0.7,
      Poor: 0.4,
      Unknown: 0.5,
    }
    return map[level || ""]
  }
  const formatValue = (value: any, digits = 2) =>
    Number.isFinite(value) ? (value as number).toFixed(digits) : "—"

  const assessment = (report as any).overall_assessment || {}
  const dimensionScores = assessment.dimension_scores || {}
  const statEval = evaluations.statistical_similarity || {}
  const statSummary = statEval.summary || {}
  const statCorr = statEval.overall_tests?.correlation || {}
  const mlEval = evaluations.ml_utility || {}
  const mlSummary = mlEval.summary || {}
  const privacyEval = evaluations.privacy || {}
  const privacySummary = privacyEval.summary || {}

  const overallScore =
    toRatio(assessment.overall_score) ??
    toRatio((report as any).overall_score) ??
    0

  const statisticalScore =
    toRatio(dimensionScores.statistical) ??
    toRatio(statSummary.pass_rate) ??
    toRatio((report as any).statistical?.column_shapes) ??
    0

  const utilityScore =
    toRatio(dimensionScores.ml_utility) ??
    toRatio(mlSummary.utility_ratio) ??
    toRatio(mlSummary.utility_percentage) ??
    toRatio((report as any).utility?.ml_efficacy) ??
    0

  const privacyScore =
    toRatio(dimensionScores.privacy) ??
    toRatio(privacyLevelToScore(privacySummary.overall_privacy_level)) ??
    toRatio((report as any).privacy?.dcr_score) ??
    0

  const statPassRate = toNumber(statSummary.pass_rate)
  const statColumns = toNumber(statSummary.num_columns_tested)
  const corrMae = toNumber(statCorr.mean_absolute_error)

  const utilityPct =
    toNumber(mlSummary.utility_percentage) ??
    (Number.isFinite(mlSummary.utility_ratio)
      ? (mlSummary.utility_ratio as number) * 100
      : undefined)
  const baselineScore = toNumber(mlSummary.baseline_score)
  const syntheticScore = toNumber(mlSummary.synthetic_score)
  const metricUsed = mlSummary.metric_used as string | undefined

  const privacyLevel = privacySummary.overall_privacy_level as string | undefined
  const privacyMembership = privacySummary.membership_vulnerability as string | undefined
  const privacyDcr = privacySummary.dcr_risk as string | undefined

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Alert if any evaluation failed */}
      {hasErrors && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-warning-foreground">
              <HelpCircle className="h-4 w-4" />
              Evaluation Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {evaluations.statistical_similarity?.status === 'error' && (
              <div className="text-sm">
                <span className="font-medium">Statistical: </span>
                <span className="text-muted-foreground">{evaluations.statistical_similarity.error || 'Failed'}</span>
              </div>
            )}
            {evaluations.ml_utility?.status === 'error' && (
              <div className="text-sm">
                <span className="font-medium">ML Utility: </span>
                <span className="text-muted-foreground">{evaluations.ml_utility.error || 'Failed'}</span>
              </div>
            )}
            {evaluations.privacy?.status === 'error' && (
              <div className="text-sm">
                <span className="font-medium">Privacy: </span>
                <span className="text-muted-foreground">{evaluations.privacy.error || 'Failed'}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Quality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <EvaluationScoreRing score={overallScore} label="Overall" size="lg" />
            <div className="grid grid-cols-3 gap-6">
              <EvaluationScoreRing score={statisticalScore} label="Statistical" size="md" />
              <EvaluationScoreRing score={utilityScore} label="ML Utility" size="md" />
              <EvaluationScoreRing
                score={privacyScore}
                label="Privacy"
                size="md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Statistical Similarity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Statistical Similarity
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Measures how closely the synthetic data distributions match the original data
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pass Rate</span>
              <span className="font-mono font-medium">
                {evaluations.statistical_similarity?.status === 'error' ? '—' : formatValue(statisticalScore)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Correlation Similarity</span>
              <span className="font-mono font-medium">
                {evaluations.statistical_similarity?.status === 'error' ? '—' : formatValue(corrMae, 3)}
              </span>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              {evaluations.statistical_similarity?.status === 'error' 
                ? 'Test failed - see warnings above'
                : (statPassRate !== undefined
                    ? `${statPassRate.toFixed(1)}% pass rate • ${statColumns ?? 0} columns`
                    : "Statistical metrics comparison")}
            </div>
          </CardContent>
        </Card>

        {/* ML Utility */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-success" />
              ML Utility
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Compares ML model performance when trained on synthetic vs real data
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ML Efficacy</span>
              <span className="font-mono font-medium">
                {evaluations.ml_utility?.status === 'error' ? '—' : formatValue(utilityScore)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Utility % of baseline</span>
              <span className="font-mono font-medium">
                {evaluations.ml_utility?.status === 'error' ? '—' : formatValue(utilityPct)}
              </span>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              {evaluations.ml_utility?.status === 'error'
                ? 'Test failed - see warnings above'
                : (metricUsed && baselineScore !== undefined && syntheticScore !== undefined
                    ? `${metricUsed}: synthetic ${formatValue(syntheticScore, 3)} vs baseline ${formatValue(baselineScore, 3)}`
                    : "Model performance preservation")}
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-warning-foreground" />
              Privacy Metrics
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Measures resistance to privacy attacks on the synthetic data
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Privacy Level</span>
              <span className="font-mono font-medium">
                {evaluations.privacy?.status === 'error' ? '—' : (privacyLevel || "—")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Membership Risk</span>
              <span className="font-mono font-medium">
                {evaluations.privacy?.status === 'error' ? '—' : (privacyMembership || "—")}
              </span>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              {evaluations.privacy?.status === 'error'
                ? 'Test failed - see warnings above'
                : (privacyDcr ? `DCR risk: ${privacyDcr}` : "Privacy attack resistance")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
