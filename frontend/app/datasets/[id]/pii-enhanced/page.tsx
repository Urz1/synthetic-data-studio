"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, AlertTriangle, CheckCircle2, Eye, EyeOff, Search, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"
import { Input } from "@/components/ui/input"

// Mock PII detection data
const mockPIIData = {
  dataset_id: "ds-123",
  dataset_name: "Customer_Support_Logs_2025.csv",
  scan_date: "2025-12-03T16:45:00Z",
  total_columns: 15,
  pii_columns_detected: 6,
  risk_score: 78, // High risk
  pii_types_found: ["EMAIL", "PHONE", "SSN", "CREDIT_CARD", "ADDRESS", "NAME"],
  column_analysis: [
    { name: "customer_id", type: "ID", pii_type: "None", confidence: 0.0, risk: "Low", action: "Keep" },
    { name: "full_name", type: "String", pii_type: "NAME", confidence: 0.98, risk: "High", action: "Mask" },
    { name: "email_address", type: "String", pii_type: "EMAIL", confidence: 0.99, risk: "High", action: "Mask" },
    { name: "phone_number", type: "String", pii_type: "PHONE", confidence: 0.95, risk: "Medium", action: "Mask" },
    { name: "ssn", type: "String", pii_type: "SSN", confidence: 0.99, risk: "Critical", action: "Drop" },
    { name: "credit_card", type: "String", pii_type: "CREDIT_CARD", confidence: 0.92, risk: "Critical", action: "Drop" },
    { name: "billing_address", type: "String", pii_type: "ADDRESS", confidence: 0.85, risk: "Medium", action: "Synthesize" },
    { name: "purchase_amount", type: "Float", pii_type: "None", confidence: 0.0, risk: "Low", action: "Keep" },
    { name: "purchase_date", type: "Date", pii_type: "None", confidence: 0.0, risk: "Low", action: "Keep" },
    { name: "product_category", type: "String", pii_type: "None", confidence: 0.05, risk: "Low", action: "Keep" },
  ]
}

export default function EnhancedPIIPage() {
  const { user } = useAuth()
  const params = useParams()
  const datasetId = params?.id as string

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "text-green-500"
      case "medium": return "text-yellow-500"
      case "high": return "text-orange-500"
      case "critical": return "text-red-500"
      default: return "text-muted-foreground"
    }
  }

  const getRiskBadge = (risk: string) => {
    const variants = {
      low: "outline" as const,
      medium: "secondary" as const,
      high: "destructive" as const,
      critical: "destructive" as const,
    }
    return <Badge variant={variants[risk.toLowerCase() as keyof typeof variants] || "outline"}>{risk}</Badge>
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "Keep": return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Keep</Badge>
      case "Mask": return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Mask</Badge>
      case "Drop": return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Drop</Badge>
      case "Synthesize": return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Synthesize</Badge>
      default: return <Badge variant="outline">{action}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Enhanced PII Detection"
          description={`Detailed PII analysis for ${mockPIIData.dataset_name}`}
          actions={
            <Button variant="outline" asChild>
              <Link href={`/datasets/${datasetId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dataset
              </Link>
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {/* Summary Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PII Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-500">{mockPIIData.risk_score}/100</div>
                <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
              <Progress value={mockPIIData.risk_score} className="h-2 mt-3 bg-red-100" />
              <p className="text-xs text-muted-foreground mt-2">
                High risk detected. Immediate action recommended.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Columns Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{mockPIIData.total_columns}</div>
                <Search className="h-8 w-8 text-primary opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {mockPIIData.pii_columns_detected} columns contain sensitive PII data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PII Types Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mt-1">
                {mockPIIData.pii_types_found.map((type, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{type}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Column Analysis</CardTitle>
                <CardDescription>Detailed breakdown of detected PII per column</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Search columns..." className="w-[200px] h-8" />
                <Button size="sm">Apply Recommendations</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Detected PII</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Recommended Action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPIIData.column_analysis.map((col, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{col.name}</TableCell>
                    <TableCell>{col.type}</TableCell>
                    <TableCell>
                      {col.pii_type !== "None" ? (
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-red-500" />
                          {col.pii_type}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {col.confidence > 0 ? (
                        <span className={col.confidence > 0.9 ? "text-green-600 font-medium" : ""}>
                          {(col.confidence * 100).toFixed(0)}%
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{getRiskBadge(col.risk)}</TableCell>
                    <TableCell>{getActionBadge(col.action)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
