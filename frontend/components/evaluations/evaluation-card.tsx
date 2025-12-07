"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { RiskIndicator } from "@/components/ui/risk-indicator"
import { EvaluationScoreRing } from "./evaluation-score-ring"
import { FileBarChart, MoreHorizontal, Eye, Download, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Evaluation } from "@/lib/types"

interface EvaluationCardProps {
  evaluation: Evaluation
  generatorName?: string
  onDelete?: () => void
  onExport?: () => void
  className?: string
}

export function EvaluationCard({ evaluation, generatorName, onDelete, onExport, className }: EvaluationCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const hasReport = evaluation.status === "completed" && evaluation.report

  return (
    <Card className={cn("group transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileBarChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle
              className="text-base line-clamp-1"
              title={generatorName || `Evaluation ${evaluation.id?.slice(0, 8) || 'N/A'}`}
            >
              {generatorName || `Evaluation ${evaluation.id?.slice(0, 8) || 'N/A'}`}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{formatDate(evaluation.created_at)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
              aria-label="Open evaluation actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/evaluations/${evaluation.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            {hasReport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="mr-2 h-4 w-4" />
                Export report
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-risk" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {hasReport ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <EvaluationScoreRing score={evaluation.report!.overall_assessment?.overall_score || 0} label="Quality" size="sm" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Statistical:</span>
                  <span className="font-mono">
                    {((evaluation.report!.evaluations.statistical_similarity?.summary.pass_rate || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">ML Utility:</span>
                  <span className="font-mono">
                    {((evaluation.report!.evaluations.ml_utility?.summary.utility_ratio || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            {/* Map privacy level (Good/Fair/Poor) to risk level (low/medium/high) */}
            <RiskIndicator 
              level={
                evaluation.report!.evaluations.privacy?.summary.overall_privacy_level === "Good" ? "low" :
                evaluation.report!.evaluations.privacy?.summary.overall_privacy_level === "Fair" ? "medium" : "high"
              } 
              size="sm" 
              showScore={false} 
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <StatusBadge status={evaluation.status} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
