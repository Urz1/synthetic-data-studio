"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, AlertTriangle, Shield, Download, FileText, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock compliance data
const mockComplianceReport = {
  generator_id: "gen-123",
  generator_name: "Patient Records Generator",
  generated_at: "2024-12-03T16:00:00Z",
  overall_status: "Compliant",
  frameworks: [
    {
      name: "GDPR",
      status: "Compliant",
      score: 100,
      requirements: [
        { id: "gdpr-1", name: "Right to Erasure", status: "Pass", details: "Synthetic data cannot be linked to original subjects" },
        { id: "gdpr-2", name: "Data Minimization", status: "Pass", details: "Only necessary attributes retained" },
        { id: "gdpr-3", name: "Anonymization", status: "Pass", details: "K-anonymity > 5 achieved" },
      ]
    },
    {
      name: "HIPAA",
      status: "Compliant",
      score: 100,
      requirements: [
        { id: "hipaa-1", name: "Safe Harbor De-identification", status: "Pass", details: "All 18 identifiers removed or transformed" },
        { id: "hipaa-2", name: "Expert Determination", status: "Pass", details: "Differential privacy guarantees statistical non-identifiability" },
      ]
    },
    {
      name: "CCPA",
      status: "Warning",
      score: 85,
      requirements: [
        { id: "ccpa-1", name: "Consumer Rights", status: "Pass", details: "Data is not personal information under CCPA" },
        { id: "ccpa-2", name: "Opt-out", status: "Warning", details: "Ensure original opt-outs are respected in training data" },
      ]
    }
  ]
}

export default function GeneratorCompliancePage() {
  const { user } = useAuth()
  const params = useParams()
  const generatorId = params?.id as string

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "compliant": return "text-green-500"
      case "pass": return "text-green-500"
      case "warning": return "text-yellow-500"
      case "non-compliant": return "text-red-500"
      case "fail": return "text-red-500"
      default: return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "compliant":
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "non-compliant":
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Compliance Report"
          description={`Regulatory compliance analysis for ${mockComplianceReport.generator_name}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/generators/${generatorId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Generator
                </Link>
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Certificate
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Overall Status</CardTitle>
              <CardDescription>Aggregate compliance assessment</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-4">
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(mockComplianceReport.overall_status)}
                <span className={`text-2xl font-bold ${getStatusColor(mockComplianceReport.overall_status)}`}>
                  {mockComplianceReport.overall_status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Generated on {new Date(mockComplianceReport.generated_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Framework Summary</CardTitle>
              <CardDescription>Status by regulatory framework</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {mockComplianceReport.frameworks.map((fw) => (
                  <div key={fw.name} className="flex flex-col items-center p-4 border rounded-lg">
                    <span className="font-semibold mb-2">{fw.name}</span>
                    <Badge variant={fw.status === "Compliant" ? "default" : "secondary"} className="mb-2">
                      {fw.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Score: {fw.score}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={mockComplianceReport.frameworks[0].name.toLowerCase()} className="space-y-6">
          <TabsList>
            {mockComplianceReport.frameworks.map((fw) => (
              <TabsTrigger key={fw.name} value={fw.name.toLowerCase()}>
                {fw.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {mockComplianceReport.frameworks.map((fw) => (
            <TabsContent key={fw.name} value={fw.name.toLowerCase()} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{fw.name} Requirements</CardTitle>
                      <CardDescription>Detailed breakdown of {fw.name} compliance checks</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {fw.score}% Compliant
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fw.requirements.map((req) => (
                    <div key={req.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="mt-1">{getStatusIcon(req.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{req.name}</h4>
                          <Badge variant="outline">{req.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.details}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
