"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskIndicator } from "@/components/ui/risk-indicator"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Shield } from "lucide-react"
import type { RiskAssessment } from "@/lib/types"

interface RiskAssessmentPanelProps {
  assessment: RiskAssessment
  className?: string
}

export function RiskAssessmentPanel({ assessment, className }: RiskAssessmentPanelProps) {
  const riskFactors = [
    {
      key: "re_identification_risk",
      label: "Re-identification Risk",
      description: "Risk of identifying individuals from synthetic data",
      data: assessment.risk_factors.re_identification_risk,
    },
    {
      key: "attribute_disclosure_risk",
      label: "Attribute Disclosure",
      description: "Risk of inferring sensitive attributes",
      data: assessment.risk_factors.attribute_disclosure_risk,
    },
    {
      key: "membership_inference_risk",
      label: "Membership Inference",
      description: "Risk of determining training data membership",
      data: assessment.risk_factors.membership_inference_risk,
    },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Privacy risk analysis</CardDescription>
            </div>
          </div>
          <RiskIndicator level={assessment.risk_level} score={assessment.risk_score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Factors */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Risk Factors</h4>
          <div className="space-y-3">
            {riskFactors.map((factor) => (
              <div key={factor.key} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{factor.label}</p>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      factor.data.level === "low" && "bg-success/10 text-success border-success/20",
                      factor.data.level === "medium" && "bg-warning/10 text-warning-foreground border-warning/20",
                      factor.data.level === "high" && "bg-risk/10 text-risk border-risk/20",
                    )}
                  >
                    {factor.data.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        factor.data.level === "low" && "bg-success",
                        factor.data.level === "medium" && "bg-warning",
                        factor.data.level === "high" && "bg-risk",
                      )}
                      style={{ width: `${factor.data.score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                    {(factor.data.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{factor.data.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium">Compliance Assessment</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3",
                assessment.compliance.hipaa_suitable ? "bg-success/5 border-success/20" : "bg-risk/5 border-risk/20",
              )}
            >
              {assessment.compliance.hipaa_suitable ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-risk" />
              )}
              <div>
                <p className="text-sm font-medium">HIPAA</p>
                <p className="text-xs text-muted-foreground">
                  {assessment.compliance.hipaa_suitable ? "Suitable" : "Not Suitable"}
                </p>
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3",
                assessment.compliance.gdpr_suitable ? "bg-success/5 border-success/20" : "bg-risk/5 border-risk/20",
              )}
            >
              {assessment.compliance.gdpr_suitable ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-risk" />
              )}
              <div>
                <p className="text-sm font-medium">GDPR</p>
                <p className="text-xs text-muted-foreground">
                  {assessment.compliance.gdpr_suitable ? "Suitable" : "Not Suitable"}
                </p>
              </div>
            </div>
          </div>
          {assessment.compliance.notes && (
            <p className="text-sm text-muted-foreground">{assessment.compliance.notes}</p>
          )}
        </div>

        {/* Recommendations */}
        {assessment.recommendations.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Recommendations</h4>
            <div className="space-y-2">
              {assessment.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
