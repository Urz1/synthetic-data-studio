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
  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Quality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <EvaluationScoreRing score={report.overall_quality_score} label="Overall" size="lg" />
            <div className="grid grid-cols-3 gap-6">
              <EvaluationScoreRing score={report.statistical_similarity.overall_score} label="Statistical" size="md" />
              <EvaluationScoreRing score={report.ml_utility.utility_preservation} label="ML Utility" size="md" />
              <EvaluationScoreRing
                score={1 - report.privacy.membership_inference_auc + 0.5}
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
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <span className="font-mono font-medium">
                {(report.statistical_similarity.overall_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Correlation Diff</span>
              <span className="font-mono font-medium">
                {report.statistical_similarity.correlation_difference.toFixed(3)}
              </span>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              {Object.keys(report.statistical_similarity.column_scores).length} columns analyzed
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
              <span className="text-sm text-muted-foreground">Utility Preservation</span>
              <span className="font-mono font-medium">
                {(report.ml_utility.utility_preservation * 100).toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Synth→Real</p>
                <p className="font-mono text-sm">
                  F1: {report.ml_utility.train_on_synthetic_test_on_real.f1.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Real→Real</p>
                <p className="font-mono text-sm">F1: {report.ml_utility.train_on_real_test_on_real.f1.toFixed(2)}</p>
              </div>
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
              <span className="text-sm text-muted-foreground">Membership AUC</span>
              <span className="font-mono font-medium">{report.privacy.membership_inference_auc.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attribute Acc</span>
              <span className="font-mono font-medium">
                {(report.privacy.attribute_inference_accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="pt-2 border-t">
              <RiskIndicator level={report.privacy.privacy_risk} size="sm" showScore={false} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
