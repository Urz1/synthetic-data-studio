"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, XCircle, User, Calendar, Hash, Tag } from "lucide-react"

interface MetricsBreakdownProps {
  metrics: Record<string, any>
  distributions: Record<string, any>
}

// ============================================================================
// COLUMN TYPE DETECTION
// ============================================================================

type ColumnType = "identifier" | "temporal" | "categorical"

interface ColumnClassification {
  type: ColumnType
  label: string
  icon: React.ReactNode
  expectLowOverlap: boolean
  explanation?: string
}

function classifyColumn(columnName: string): ColumnClassification {
  const name = columnName.toLowerCase()
  
  const identifierPatterns = [
    /^id$/i, /_id$/i, /^uuid$/i, /email/i, /phone/i, /^ssn$/i,
    /transaction/i, /account.*number/i, /^username$/i,
  ]
  
  const namePatterns = [
    /^name$/i, /first.*name/i, /last.*name/i, /full.*name/i,
    /^fname$/i, /^lname$/i, /customer.*name/i,
  ]
  
  const temporalPatterns = [
    /date/i, /time/i, /created/i, /updated/i, /_at$/i, /timestamp/i,
  ]
  
  if (identifierPatterns.some(p => p.test(name))) {
    return {
      type: "identifier",
      label: "Unique ID",
      icon: <Hash className="h-4 w-4" />,
      expectLowOverlap: true,
      explanation: "Unique identifiers have different values in synthetic data by design."
    }
  }
  
  if (namePatterns.some(p => p.test(name))) {
    return {
      type: "identifier",
      label: "Personal Info",
      icon: <User className="h-4 w-4" />,
      expectLowOverlap: true,
      explanation: "Personal names are synthesized differently for privacy protection."
    }
  }
  
  if (temporalPatterns.some(p => p.test(name))) {
    return {
      type: "temporal",
      label: "Date/Time",
      icon: <Calendar className="h-4 w-4" />,
      expectLowOverlap: false,
    }
  }
  
  return {
    type: "categorical",
    label: "Attribute",
    icon: <Tag className="h-4 w-4" />,
    expectLowOverlap: false,
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MetricsBreakdown({ metrics, distributions }: MetricsBreakdownProps) {
  const classifiedColumns = Object.keys(metrics || {}).map(col => ({
    name: col,
    classification: classifyColumn(col),
    tests: metrics[col]
  }))
  
  const measurableColumns = classifiedColumns.filter(c => !c.classification.expectLowOverlap)
  const identifierColumns = classifiedColumns.filter(c => c.classification.expectLowOverlap)
  
  const sortByOverlap = (a: any, b: any) => {
    const aOverlap = a.tests.find((t: any) => t.test === "Histogram Overlap")?.score || 0
    const bOverlap = b.tests.find((t: any) => t.test === "Histogram Overlap")?.score || 0
    return aOverlap - bOverlap
  }
  
  measurableColumns.sort(sortByOverlap)
  identifierColumns.sort(sortByOverlap)

  const renderColumnCard = (col: typeof classifiedColumns[0]) => {
    const tests = col.tests
    const ksTest = tests.find((t: any) => t.test === "Kolmogorov-Smirnov")
    const ovTest = tests.find((t: any) => t.test === "Histogram Overlap")
    const overlap = ovTest ? ovTest.score : 0
    const classification = col.classification
    
    // Get badge based on column type
    const getBadge = () => {
      if (classification.expectLowOverlap) {
        // For identifiers: low overlap is GOOD
        return overlap < 0.3 ? (
          <Badge className="badge-success">Expected</Badge>
        ) : (
          <Badge className="badge-warning">Review</Badge>
        )
      }
      // For measurable columns
      if (overlap >= 0.85) return <Badge className="badge-success">Excellent</Badge>
      if (overlap >= 0.7) return <Badge className="badge-success">Good</Badge>
      if (overlap >= 0.5) return <Badge className="badge-warning">Fair</Badge>
      return <Badge className="badge-risk">Poor</Badge>
    }
    
    return (
      <Card key={col.name}>
        <CardHeader className="pb-2 space-y-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-muted-foreground">{classification.icon}</span>
              <span className="font-medium text-sm truncate" title={col.name}>
                {col.name}
              </span>
            </div>
            {getBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          {!classification.expectLowOverlap ? (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Distribution Overlap</span>
                <span className="font-mono font-medium text-foreground">
                  {(overlap * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={overlap * 100} className="h-2" />
              {ksTest && (
                <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t">
                  <span className="text-muted-foreground">KS Test</span>
                  <span className={ksTest.passed ? "text-success" : "text-risk"}>
                    {ksTest.passed ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Passed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {classification.explanation}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {measurableColumns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Measurable Attributes</h3>
            <span className="text-xs text-muted-foreground">— Overlap matters</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {measurableColumns.slice(0, 6).map(renderColumnCard)}
          </div>
        </div>
      )}
      
      {identifierColumns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Identifiers & Unique Values</h3>
            <span className="text-xs text-muted-foreground">— Low overlap expected</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {identifierColumns.slice(0, 6).map(renderColumnCard)}
          </div>
        </div>
      )}
      
      {measurableColumns.length === 0 && identifierColumns.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No column metrics available</p>
        </div>
      )}
    </div>
  )
}
