"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Zap, BarChart3, Brain, Shield } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data
const mockGenerators = [
  { id: "g1", name: "Patient Records Generator", datasetId: "d1" },
  { id: "g2", name: "Financial Transactions", datasetId: "d2" },
  { id: "g3", name: "Customer Demographics", datasetId: "d3" },
]

const mockDatasets = [
  { id: "d1", name: "patients.csv", columns: ["age", "gender", "diagnosis", "ssn", "email"] },
  { id: "d2", name: "transactions.csv", columns: ["amount", "date", "merchant", "category"] },
  { id: "d3", name: "customers.json", columns: ["email", "phone", "address"] },
]

export default function NewEvaluationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedGenerator = searchParams.get("generator")

  const [selectedGeneratorId, setSelectedGeneratorId] = React.useState(preselectedGenerator || "")
  const [config, setConfig] = React.useState({
    include_statistical: true,
    include_ml_utility: true,
    include_privacy: true,
    target_column: "",
    sensitive_columns: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const mockUser = { full_name: "John Doe", email: "john@example.com" }
  const selectedGenerator = mockGenerators.find((g) => g.id === selectedGeneratorId)
  const selectedDataset = selectedGenerator ? mockDatasets.find((d) => d.id === selectedGenerator.datasetId) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGeneratorId) return

    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      router.push("/evaluations")
    }, 1500)
  }

  const toggleSensitiveColumn = (column: string) => {
    setConfig((prev) => ({
      ...prev,
      sensitive_columns: prev.sensitive_columns.includes(column)
        ? prev.sensitive_columns.filter((c) => c !== column)
        : [...prev.sensitive_columns, column],
    }))
  }

  return (
    <AppShell user={mockUser}>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/evaluations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evaluations
          </Link>
        </Button>
      </div>

      <PageHeader title="Run Evaluation" description="Assess the quality and privacy of your synthetic data" />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Generator Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Select Generator
                </CardTitle>
                <CardDescription>Choose a completed generator to evaluate</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedGeneratorId} onValueChange={setSelectedGeneratorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a generator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockGenerators.map((generator) => (
                      <SelectItem key={generator.id} value={generator.id}>
                        {generator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Evaluation Options */}
            {selectedGeneratorId && (
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Options</CardTitle>
                  <CardDescription>Choose which metrics to include</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="statistical" className="font-medium">
                          Statistical Similarity
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Compare distributions between real and synthetic data
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="statistical"
                      checked={config.include_statistical}
                      onCheckedChange={(checked) => setConfig({ ...config, include_statistical: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-success/10 p-2">
                        <Brain className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <Label htmlFor="ml_utility" className="font-medium">
                          ML Utility
                        </Label>
                        <p className="text-xs text-muted-foreground">Test ML model performance on synthetic data</p>
                      </div>
                    </div>
                    <Switch
                      id="ml_utility"
                      checked={config.include_ml_utility}
                      onCheckedChange={(checked) => setConfig({ ...config, include_ml_utility: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-warning/10 p-2">
                        <Shield className="h-4 w-4 text-warning-foreground" />
                      </div>
                      <div>
                        <Label htmlFor="privacy" className="font-medium">
                          Privacy Metrics
                        </Label>
                        <p className="text-xs text-muted-foreground">Run privacy attack simulations</p>
                      </div>
                    </div>
                    <Switch
                      id="privacy"
                      checked={config.include_privacy}
                      onCheckedChange={(checked) => setConfig({ ...config, include_privacy: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Column Configuration */}
            {selectedDataset && config.include_privacy && (
              <Card>
                <CardHeader>
                  <CardTitle>Column Configuration</CardTitle>
                  <CardDescription>Select sensitive columns for privacy analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config.include_ml_utility && (
                    <div className="space-y-2">
                      <Label>Target Column (for ML utility)</Label>
                      <Select
                        value={config.target_column}
                        onValueChange={(value) => setConfig({ ...config, target_column: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDataset.columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Sensitive Columns (for privacy checks)</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDataset.columns.map((col) => (
                        <Badge
                          key={col}
                          variant={config.sensitive_columns.includes(col) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleSensitiveColumn(col)}
                        >
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/evaluations">Cancel</Link>
              </Button>
              <Button type="submit" disabled={!selectedGeneratorId || isSubmitting}>
                {isSubmitting ? "Starting..." : "Run Evaluation"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What Gets Evaluated?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Statistical Similarity</p>
                  <p className="text-muted-foreground text-xs">KS tests, chi-square tests, correlation analysis</p>
                </div>
                <div>
                  <p className="font-medium">ML Utility</p>
                  <p className="text-muted-foreground text-xs">Train-on-synthetic, test-on-real comparison</p>
                </div>
                <div>
                  <p className="font-medium">Privacy Metrics</p>
                  <p className="text-muted-foreground text-xs">Membership inference, attribute disclosure attacks</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score Interpretation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Excellent</span>
                  <span className="font-mono text-success">{">"} 85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Good</span>
                  <span className="font-mono text-primary">70-85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fair</span>
                  <span className="font-mono text-warning-foreground">50-70%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Poor</span>
                  <span className="font-mono text-risk">{"<"} 50%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AppShell>
  )
}
