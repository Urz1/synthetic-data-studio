"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, AlertCircle, CheckCircle2, Users, Target, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock model card data
const mockModelCard = {
  model_details: {
    name: "Patient Records Generator",
    version: "1.0.0",
    type: "DP-CTGAN",
    description: "Differentially private synthetic data generator for healthcare patient records",
    developed_by: "Healthcare Analytics Team",
    developed_date: "2024-12-01",
    model_architecture: "Conditional Tabular GAN with Differential Privacy",
  },
  intended_use: {
    primary_uses: [
      "Generate synthetic patient data for research and development",
      "Privacy-preserving data sharing with third parties",
      "Model training and testing without exposing real patient information",
    ],
    primary_users: [
      "Healthcare researchers",
      "Data scientists",
      "Medical software developers",
    ],
    out_of_scope: [
      "Direct patient care or clinical decision making",
      "Production deployment without additional validation",
      "Use on datasets from different healthcare systems without retraining",
    ],
  },
  factors: {
    relevant_factors: [
      "Patient demographics (age, gender, ethnicity)",
      "Medical conditions and diagnoses",
      "Treatment history and medications",
      "Laboratory test results",
    ],
    evaluation_factors: [
      "Statistical similarity to original data",
      "Privacy preservation (epsilon < 10)",
      "Utility for downstream ML tasks",
    ],
  },
  metrics: {
    model_performance: [
      { name: "Statistical Similarity", value: "92%", benchmark: "> 85%" },
      { name: "ML Utility", value: "88%", benchmark: "> 80%" },
      { name: "Privacy Score", value: "87%", benchmark: "> 70%" },
    ],
    privacy_metrics: [
      { name: "Epsilon (ε)", value: "8.2", benchmark: "< 10" },
      { name: "Delta (δ)", value: "9.5e-6", benchmark: "< 1e-5" },
      { name: "K-Anonymity", value: "7", benchmark: "> 5" },
    ],
  },
  training_data: {
    dataset_name: "PHI_Protected_Patients_2024",
    num_records: 50000,
    features: 45,
    date_range: "2020-2024",
    preprocessing: [
      "Removed direct identifiers (names, SSN, MRN)",
      "Normalized numerical features",
      "One-hot encoded categorical variables",
      "Handled missing values with mode/median imputation",
    ],
  },
  ethical_considerations: {
    risks: [
      {
        risk: "Potential Re-identification",
        mitigation: "Applied differential privacy with ε=8.2, δ=9.5e-6. K-anonymity of 7 maintained.",
        severity: "low",
      },
      {
        risk: "Bias Amplification",
        mitigation: "Monitored demographic distributions. Fairness metrics tracked across age, gender, ethnicity.",
        severity: "medium",
      },
      {
        risk: "Data Quality Degradation",
        mitigation: "Privacy-utility trade-off analysis performed. Utility metrics above 85% threshold.",
        severity: "low",
      },
    ],
    sensitive_data: [
      "Protected Health Information (PHI)",
      "Demographic attributes",
      "Medical diagnoses and conditions",
    ],
  },
  caveats_recommendations: {
    limitations: [
      "Model trained on US healthcare data only - may not generalize to other countries",
      "Best performance on datasets with similar size (25K-100K records)",
      "Complex rare events may not be well represented",
    ],
    recommendations: [
      "Validate synthetic data quality for your specific use case",
      "Conduct additional privacy audits before external sharing",
      "Monitor for distribution drift if using over extended periods",
      "Consider ensemble with other privacy techniques for highest security",
    ],
  },
}

export default function ModelCardPage() {
  const { user } = useAuth()
  const params = useParams()
  const generatorId = params?.id as string

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "default" as const,
      medium: "secondary" as const,
      high: "destructive" as const,
    }
    return <Badge variant={variants[severity] || "outline"}>{severity.toUpperCase()}</Badge>
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Model Card"
          description={`Documentation for ${mockModelCard.model_details.name}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/generators/${generatorId}`}>Back to Generator</Link>
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Model Card
              </Button>
            </div>
          }
        />

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {mockModelCard.model_details.name}
                </CardTitle>
                <CardDescription className="mt-2">{mockModelCard.model_details.description}</CardDescription>
              </div>
              <Badge variant="outline">v{mockModelCard.model_details.version}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Model Type</p>
                <p className="font-medium">{mockModelCard.model_details.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Developed By</p>
                <p className="font-medium">{mockModelCard.model_details.developed_by}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(mockModelCard.model_details.developed_date).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="intended-use" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="intended-use">Intended Use</TabsTrigger>
            <TabsTrigger value="metrics">Performance</TabsTrigger>
            <TabsTrigger value="training">Training Data</TabsTrigger>
            <TabsTrigger value="ethics">Ethics</TabsTrigger>
            <TabsTrigger value="caveats">Caveats</TabsTrigger>
          </TabsList>

          {/* Intended Use */}
          <TabsContent value="intended-use" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Primary Uses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockModelCard.intended_use.primary_uses.map((use, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{use}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Intended Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockModelCard.intended_use.primary_users.map((user, idx) => (
                    <Badge key={idx} variant="secondary">{user}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Out of Scope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockModelCard.intended_use.out_of_scope.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Metrics */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Model Performance</CardTitle>
                  <CardDescription>Quality and utility metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockModelCard.metrics.model_performance.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{metric.name}</p>
                          <p className="text-xs text-muted-foreground">Benchmark: {metric.benchmark}</p>
                        </div>
                        <Badge variant="default">{metric.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Privacy Metrics</CardTitle>
                  <CardDescription>Differential privacy guarantees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockModelCard.metrics.privacy_metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{metric.name}</p>
                          <p className="text-xs text-muted-foreground">Benchmark: {metric.benchmark}</p>
                        </div>
                        <Badge variant="default">{metric.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training Data */}
          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dataset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Dataset Name</p>
                    <p className="font-medium">{mockModelCard.training_data.dataset_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Records</p>
                    <p className="font-medium">{mockModelCard.training_data.num_records.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Features</p>
                    <p className="font-medium">{mockModelCard.training_data.features}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Range</p>
                    <p className="font-medium">{mockModelCard.training_data.date_range}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Preprocessing Steps</p>
                  <ul className="space-y-1">
                    {mockModelCard.training_data.preprocessing.map((step, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ethical Considerations */}
          <TabsContent value="ethics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Identified Risks & Mitigations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockModelCard.ethical_considerations.risks.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.risk}</p>
                      {getSeverityBadge(item.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.mitigation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sensitive Data Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockModelCard.ethical_considerations.sensitive_data.map((item, idx) => (
                    <Badge key={idx} variant="destructive">{item}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Caveats & Recommendations */}
          <TabsContent value="caveats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Limitations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockModelCard.caveats_recommendations.limitations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockModelCard.caveats_recommendations.recommendations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
