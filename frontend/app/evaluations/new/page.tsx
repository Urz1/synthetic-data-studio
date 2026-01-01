"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Zap, BarChart3, Brain, Shield, AlertTriangle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import type { Generator, Dataset } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"
import { useToast } from "@/hooks/use-toast"

export default function NewEvaluationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedGeneratorId = searchParams.get("generator")
  const { user } = useAuth()
  const { toast } = useToast()

  // Data State
  const [generators, setGenerators] = React.useState<Generator[]>([])
  const [selectedGenerator, setSelectedGenerator] = React.useState<Generator | null>(null)
  const [dataset, setDataset] = React.useState<Dataset | null>(null)
  
  // UI State
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Config State
  const [config, setConfig] = React.useState({
    include_statistical: true,
    include_ml_utility: true,
    include_privacy: true,
    target_column: "",
    sensitive_columns: [] as string[],
    statistical_columns: [] as string[], // New state for statistical columns
  })

  // Load Generators
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const data = await api.listGenerators()
        // Filter for completed generators with a source dataset (exclude schema-based)
        // Schema generators can't be evaluated as they have no original data to compare against
        const evaluatable = data.filter(g => 
          g.status === 'completed' && 
          g.type !== 'schema' && 
          g.dataset_id // Must have a source dataset
        )
        setGenerators(evaluatable)

        // Handle preselection
        if (preselectedGeneratorId) {
          const preselected = evaluatable.find((g: Generator) => g.id === preselectedGeneratorId)
          if (preselected) {
            handleGeneratorChange(preselected.id)
          }
        }
      } catch (err) {
        console.error("Failed to load generators:", err)
        setError("Failed to load generators. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedGeneratorId])

  // Handle Generator Selection
  const handleGeneratorChange = async (generatorId: string) => {
    const generator = generators.find(g => g.id === generatorId)
    setSelectedGenerator(generator || null)
    
    // Reset config that depends on dataset
    setConfig(prev => ({ ...prev, target_column: "", sensitive_columns: [], statistical_columns: [] }))
    
    if (generator?.dataset_id) {
      try {
        // Fetch source dataset details to get columns
        const datasetData = await api.getDataset(generator.dataset_id)
        setDataset(datasetData)

        // Smart Default Selection for Statistical Columns
        if (datasetData.schema_data) {
             const allCols = Object.keys(datasetData.schema_data).filter(c => !c.startsWith('_'))
             
             // Filter out likely IDs and PII for statistical tests
             const idPatterns = ['id', 'uuid', 'guid', 'key', 'hash', 'token', 'url', 'email', 'phone', 'created_at', 'updated_at', 'timestamp']
             const defaultStatsCols = allCols.filter(col => {
                 const colLower = col.toLowerCase()
                 // Exclude if it perfectly matches an ID pattern or ends with _id
                 if (colLower.endsWith('_id')) return false
                 if (idPatterns.some(p => colLower.includes(p))) return false
                 return true
             })
             
             // If filter removes everything, specific fallback or keep all
             const finalCols = defaultStatsCols.length > 0 ? defaultStatsCols : allCols
             
             setConfig(prev => ({ ...prev, statistical_columns: finalCols }))
        }
      } catch (err) {
        console.error("Failed to load dataset details:", err)
      }
    } else {
        setDataset(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGenerator || !dataset) return

    setIsSubmitting(true)
    setError(null)

    try {
      await api.runEvaluation({
        generator_id: selectedGenerator.id,
        dataset_id: dataset.id, // Compare against source dataset
        config: {
            metrics: {
                statistical: config.include_statistical,
                ml_utility: config.include_ml_utility,
                privacy: config.include_privacy
            },
            ml_utility_config: config.include_ml_utility && config.target_column ? {
                target_column: config.target_column,
                models: ["lr", "rf"], // Default models
                test_size: 0.2
            } : undefined,

            privacy_config: config.include_privacy && config.sensitive_columns.length > 0 ? {
                sensitive_columns: config.sensitive_columns,
                attacks: ["membership_inference"]
            } : undefined,
            statistical_columns: config.include_statistical ? config.statistical_columns : undefined
        }
      })
      
      // Success feedback before redirect
      toast({
        title: "Evaluation Started",
        description: "Your evaluation is running. Results will appear shortly.",
      })
      
      router.push("/evaluations")
    } catch (err) {
      console.error("Failed to run evaluation:", err)
      setError(err instanceof Error ? err.message : "Failed to run evaluation")
      setIsSubmitting(false)
    }
  }

  const toggleSensitiveColumn = (column: string) => {
    setConfig((prev) => ({
      ...prev,
      sensitive_columns: prev.sensitive_columns.includes(column)
        ? prev.sensitive_columns.filter((c) => c !== column)
        : [...prev.sensitive_columns, column],
    }))
  }

  const toggleStatisticalColumn = (column: string) => {
    setConfig((prev) => ({
      ...prev,
      statistical_columns: prev.statistical_columns.includes(column)
        ? prev.statistical_columns.filter((c) => c !== column)
        : [...prev.statistical_columns, column],
    }))
  }

  // Loading View
  if (isLoading) {
      return (
          <ProtectedRoute>
          <AppShell user={user || { full_name: "", email: "" }}>
              <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          </AppShell>
          </ProtectedRoute>
      )
  }

  return (
    <ProtectedRoute>
    <AppShell user={user || { full_name: "", email: "" }}>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/evaluations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evaluations
          </Link>
        </Button>
      </div>

      <PageHeader title="Run Evaluation" description="Assess the quality and privacy of your synthetic data" />

      {error && (
          <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4"/>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      {generators.length === 0 ? (
          <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4"/>
              <AlertDescription>
                  No completed generators found. Please <Link href="/generators/new" className="underline">create and train a generator</Link> first.
              </AlertDescription>
          </Alert>
      ) : (
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
                <Select 
                    value={selectedGenerator?.id || ""} 
                    onValueChange={handleGeneratorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a generator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {generators.map((generator) => (
                      <SelectItem key={generator.id} value={generator.id}>
                        <div className="flex items-center gap-2 max-w-[500px]">
                            <span className="truncate">{generator.name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">{generator.type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Evaluation Options */}
            {selectedGenerator && (
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

            {/* Statistical Columns Configuration */}
            {dataset && config.include_statistical && (
                 <Card>
                 <CardHeader>
                   <CardTitle>Statistical Analysis Columns</CardTitle>
                   <CardDescription>
                       Select columns to analyze for statistical similarity. 
                       <span className="block mt-1 text-xs text-muted-foreground">
                        Tip: Exclude unique identifiers (IDs, Emails) to avoid false "0% Quality" scores.
                       </span>
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     {dataset.schema_data && Object.keys(dataset.schema_data).length > 0 && (
                     <div className="flex flex-wrap gap-2">
                        {Object.keys(dataset.schema_data)
                         .filter(col => !col.startsWith('_')) 
                         .map((colName) => (
                                 <Badge
                                 key={`stat-${colName}`}
                                 variant={config.statistical_columns.includes(colName) ? "secondary" : "outline"}
                                 className={`cursor-pointer ${config.statistical_columns.includes(colName) ? "border-primary/30" : "opacity-60"}`}
                                 onClick={() => toggleStatisticalColumn(colName)}
                                 >
                                 {colName}
                                 </Badge>
                             )
                        )}
                       </div>
                     )}
                 </CardContent>
               </Card>
            )}

            {/* Column Configuration */}
            {dataset && (config.include_ml_utility || config.include_privacy) && (
              <Card>
                <CardHeader>
                  <CardTitle>Column Configuration</CardTitle>
                  <CardDescription>
                      {config.include_ml_utility && <span>Select target column for ML utility.</span>}
                      {config.include_privacy && <span> Select sensitive columns for privacy analysis.</span>}
                  </CardDescription>
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
                          {dataset.schema_data && Object.keys(dataset.schema_data).length > 0 ? 
                              Object.keys(dataset.schema_data)
                                .filter(col => !col.startsWith('_')) // Hide system/internal columns
                                .map((colName) => (
                                <SelectItem key={colName} value={colName}>
                                  {colName}
                                </SelectItem>
                              ))
                          : (
                               <SelectItem value="none" disabled>No columns found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {config.include_privacy && dataset.schema_data && Object.keys(dataset.schema_data).length > 0 && (
                    <div className="space-y-2">
                      <Label>Sensitive Columns (for privacy checks)</Label>
                      <div className="flex flex-wrap gap-2">
                       {Object.keys(dataset.schema_data)
                        .filter(col => !col.startsWith('_')) // Hide system/internal columns
                        .map((colName) => (
                                <Badge
                                key={colName}
                                variant={config.sensitive_columns.includes(colName) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => toggleSensitiveColumn(colName)}
                                >
                                {colName}
                                </Badge>
                            )
                       )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/evaluations">Cancel</Link>
              </Button>
              <Button type="submit" disabled={!selectedGenerator || isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Starting...
                    </>
                ) : "Run Evaluation"}
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
      )}
    </AppShell>
    </ProtectedRoute>
  )
}
