"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Shield, CheckCircle2, AlertCircle, Download, ArrowRight, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock risk assessment data
const mockRiskData = {
  evaluation_id: "eval-123",
  dataset_name: "Synthetic Patient Data V1",
  overall_risk_score: 12, // 0-100, lower is better
  risk_level: "Low",
  assessed_at: "2024-12-03T15:00:00Z",
  vulnerabilities: [
    {
      id: "vuln-1",
      name: "Outlier Re-identification",
      severity: "Medium",
      score: 45,
      description: "Potential for re-identifying individuals with unique attribute combinations",
      affected_records: 12,
      mitigation: "Increase k-anonymity threshold or apply additional suppression",
    },
    {
      id: "vuln-2",
      name: "Attribute Inference",
      severity: "Low",
      score: 15,
      description: "Ability to infer sensitive attributes from public attributes",
      affected_records: 5,
      mitigation: "Verify l-diversity for sensitive columns",
    },
    {
      id: "vuln-3",
      name: "Membership Inference",
      severity: "Low",
      score: 8,
      description: "Ability to determine if a record was in the training set",
      affected_records: 0,
      mitigation: "Differential privacy guarantee is sufficient (ε=8.2)",
    },
  ],
  attack_simulations: [
    {
      name: "Linkage Attack",
      success_rate: "0.02%",
      status: "Passed",
      threshold: "< 1%",
    },
    {
      name: "Singling Out",
      success_rate: "0.15%",
      status: "Passed",
      threshold: "< 0.5%",
    },
    {
      name: "Inference Attack",
      success_rate: "1.2%",
      status: "Warning",
      threshold: "< 1%",
    },
  ],
  privacy_guarantees: [
    { name: "Differential Privacy", status: "Active", details: "ε=8.2, δ=1e-5" },
    { name: "K-Anonymity", status: "Active", details: "k=7" },
    { name: "L-Diversity", status: "Active", details: "l=4" },
  ]
}

export default function RiskAssessmentPage() {
  const { user } = useAuth()
  const params = useParams()
  const evaluationId = params?.id as string

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low": return "text-green-500"
      case "medium": return "text-yellow-500"
      case "high": return "text-red-500"
      case "critical": return "text-red-700"
      default: return "text-muted-foreground"
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "outline" as const,
      medium: "secondary" as const,
      high: "destructive" as const,
      critical: "destructive" as const,
    }
    return <Badge variant={variants[severity.toLowerCase() as keyof typeof variants] || "outline"}>{severity}</Badge>
  }

  const getScoreColor = (score: number) => {
    if (score < 20) return "text-green-500"
    if (score < 50) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Risk Assessment"
          description={`Security and privacy risk analysis for ${mockRiskData.dataset_name}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/evaluations/${evaluationId}`}>Back to Evaluation</Link>
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {/* Overall Risk Score */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Overall Risk Score</CardTitle>
              <CardDescription>Aggregate privacy risk metric</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2">
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-muted">
                <div className={`text-4xl font-bold ${getScoreColor(mockRiskData.overall_risk_score)}`}>
                  {mockRiskData.overall_risk_score}
                </div>
                <div className="absolute -bottom-2 bg-background px-2 text-sm font-medium text-muted-foreground">
                  / 100
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {mockRiskData.risk_level} Risk
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Assessed on {new Date(mockRiskData.assessed_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attack Simulations */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Attack Simulations
              </CardTitle>
              <CardDescription>Results from simulated privacy attacks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRiskData.attack_simulations.map((attack, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {attack.status === "Passed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{attack.name}</p>
                        <p className="text-xs text-muted-foreground">Threshold: {attack.threshold}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{attack.success_rate}</p>
                      <p className={`text-xs ${attack.status === "Passed" ? "text-green-500" : "text-yellow-500"}`}>
                        {attack.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vulnerabilities" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="guarantees">Privacy Guarantees</TabsTrigger>
            <TabsTrigger value="mitigation">Mitigation Plan</TabsTrigger>
          </TabsList>

          {/* Vulnerabilities Tab */}
          <TabsContent value="vulnerabilities" className="space-y-4">
            {mockRiskData.vulnerabilities.map((vuln) => (
              <Card key={vuln.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className={`h-4 w-4 ${getSeverityColor(vuln.severity)}`} />
                        {vuln.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{vuln.description}</CardDescription>
                    </div>
                    {getSeverityBadge(vuln.severity)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Risk Score</p>
                      <Progress value={vuln.score} className="h-2 mt-2" />
                      <p className="text-xs mt-1 text-right">{vuln.score}/100</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Affected Records</p>
                      <p className="font-medium mt-1">{vuln.affected_records}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recommended Mitigation</p>
                      <p className="font-medium mt-1 text-primary">{vuln.mitigation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Privacy Guarantees Tab */}
          <TabsContent value="guarantees" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {mockRiskData.privacy_guarantees.map((guarantee, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      {guarantee.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        {guarantee.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-mono bg-muted p-2 rounded text-center">
                      {guarantee.details}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full h-fit">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Strong Protection Detected</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This dataset implements multiple layers of privacy protection including Differential Privacy and K-Anonymity. 
                      The risk of re-identification is considered low for most standard use cases.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mitigation Plan Tab */}
          <TabsContent value="mitigation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>Steps to further reduce privacy risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRiskData.vulnerabilities.map((vuln, idx) => (
                    <div key={idx} className="flex gap-4 items-start p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{vuln.mitigation}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Addresses: <span className="font-medium text-foreground">{vuln.name}</span>
                        </p>
                      </div>
                      <Button size="sm" variant="outline">Apply Fix</Button>
                    </div>
                  ))}
                  
                  <div className="flex gap-4 items-start p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Schedule Periodic Re-assessment</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ensure privacy guarantees hold as new auxiliary data becomes available
                      </p>
                    </div>
                    <Button size="sm" variant="outline">Schedule</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
