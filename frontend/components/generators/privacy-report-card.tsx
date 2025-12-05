"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EpsilonBadge } from "@/components/ui/epsilon-badge"
import { Shield, Download, FileText, CheckCircle2, Info } from "lucide-react"
import type { Generator } from "@/lib/types"

interface PrivacyReportCardProps {
  generator: Generator
  privacyGuarantee?: string
  recommendations?: string[]
  onExportPdf?: () => void
  className?: string
}

export function PrivacyReportCard({
  generator,
  privacyGuarantee,
  recommendations,
  onExportPdf,
  className,
}: PrivacyReportCardProps) {
  const hasDP = generator.privacy_config?.use_differential_privacy
  const epsilon = generator.privacy_spent?.epsilon ?? generator.privacy_config?.target_epsilon
  const delta = generator.privacy_spent?.delta ?? generator.privacy_config?.target_delta

  return (
    <Card className={cn(hasDP && "border-success/30", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-5 w-5", hasDP ? "text-success" : "text-muted-foreground")} />
            <div>
              <CardTitle>Privacy Report</CardTitle>
              <CardDescription>{hasDP ? "Differential privacy enabled" : "No differential privacy"}</CardDescription>
            </div>
          </div>
          {hasDP && (
            <Button variant="outline" size="sm" onClick={onExportPdf}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasDP ? (
          <>
            {/* Privacy Metrics */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-2">Privacy Budget Spent</p>
                <EpsilonBadge epsilon={epsilon} delta={delta} size="md" />
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-2">Mechanism</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">{generator.type}</code>
              </div>
            </div>

            {/* Privacy Guarantee */}
            {privacyGuarantee && (
              <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <p className="text-sm">{privacyGuarantee}</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations</p>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">This generator was trained without differential privacy.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Consider using DP-CTGAN or DP-TVAE for privacy guarantees.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
