"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

interface ColumnRowProps {
  name: string
  dataType: "NUMERIC" | "CATEGORICAL" | "DATETIME" | "TEXT"
  overlap: number // 0-100
  testName: string // "KS TEST" or "CHI-SQUARE"
  testPassed: boolean | "warning"
  quality: "Excellent" | "Good" | "Fair" | "Poor" | "Perfect"
}

const qualityColors: Record<string, string> = {
  Excellent: "bg-success/15 text-success border-success/30",
  Perfect: "bg-primary/15 text-primary border-primary/30",
  Good: "bg-primary/15 text-primary border-primary/30",
  Fair: "bg-warning/15 text-warning-foreground border-warning/30",
  Poor: "bg-risk/15 text-risk border-risk/30",
}

const dataTypeColors: Record<string, string> = {
  NUMERIC: "bg-blue-500/10 text-blue-500",
  CATEGORICAL: "bg-purple-500/10 text-purple-500",
  DATETIME: "bg-orange-500/10 text-orange-500",
  TEXT: "bg-slate-500/10 text-slate-500",
}

export function ColumnRow({
  name,
  dataType,
  overlap,
  testName,
  testPassed,
  quality,
}: ColumnRowProps) {
  const TestIcon = () => {
    if (testPassed === true) {
      return <CheckCircle2 className="h-4 w-4 text-success" />
    }
    if (testPassed === "warning") {
      return <AlertTriangle className="h-4 w-4 text-warning-foreground" />
    }
    return <XCircle className="h-4 w-4 text-risk" />
  }

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
      {/* Column name and type */}
      <div className="min-w-[140px] flex-shrink-0">
        <p className="font-medium text-sm truncate" title={name}>
          {name}
        </p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${dataTypeColors[dataType]}`}>
          {dataType}
        </span>
      </div>

      {/* Overlap bar */}
      <div className="flex-1 min-w-[120px]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-12">OVERLAP</span>
          <Progress value={overlap} className="flex-1 h-2" />
          <span className="text-sm font-mono font-medium w-14 text-right">
            {overlap.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Test status */}
      <div className="flex items-center gap-2 min-w-[90px]">
        <span className="text-xs text-muted-foreground">{testName}</span>
        <TestIcon />
      </div>

      {/* Quality badge */}
      <Badge 
        variant="outline" 
        className={`min-w-[80px] justify-center ${qualityColors[quality]}`}
      >
        {quality}
      </Badge>
    </div>
  )
}
