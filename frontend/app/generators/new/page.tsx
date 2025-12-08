"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GeneratorConfigForm, type GeneratorConfig } from "@/components/generators/generator-config-form"
import { ArrowLeft, Database, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import type { Dataset } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"

export default function NewGeneratorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedDataset = searchParams.get("dataset")
  const { user } = useAuth()

  const [datasets, setDatasets] = React.useState<Dataset[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = React.useState(preselectedDataset || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Load datasets on mount
  React.useEffect(() => {
    async function loadDatasets() {
      try {
        const data = await api.listDatasets()
        // Handle both array and object with datasets property
        const datasetsList = Array.isArray(data) ? data : (data as any).datasets || []
        setDatasets(datasetsList)
      } catch (err) {
        console.error("Failed to load datasets:", err)
        setError("Failed to load datasets. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    loadDatasets()
  }, [])

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId)

  const handleSubmit = async (config: GeneratorConfig) => {
    if (!selectedDatasetId) {
      setError("Please select a dataset first")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await api.createGenerator(selectedDatasetId, {
        name: config.name,
        model_type: config.model_type,
        num_rows: config.num_rows,
        epochs: config.epochs,
        batch_size: config.batch_size,
        use_differential_privacy: config.use_differential_privacy,
        target_epsilon: config.target_epsilon,
        target_delta: config.target_delta,
        max_grad_norm: config.max_grad_norm
      })
      
      // Redirect to generator details or list
      router.push(`/generators/${response.generator_id}`)
      
    } catch (err) {
      console.error("Failed to create generator:", err)
      setError(err instanceof Error ? err.message : "Failed to create generator")
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/generators">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generators
            </Link>
          </Button>
        </div>

        <PageHeader title="Create Generator" description="Configure and train a new synthetic data generator" />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Dataset Selection */}
            {!selectedDatasetId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Select Source Dataset
                  </CardTitle>
                  <CardDescription>Choose the dataset to train your generator on</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : datasets.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No datasets found. <Link href="/datasets/upload" className="text-primary hover:underline">Upload one first</Link>.
                    </div>
                  ) : (
                    <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dataset..." />
                      </SelectTrigger>
                      <SelectContent>
                        {datasets.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            <div className="flex items-center gap-2">
                              <span>{dataset.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({dataset.row_count?.toLocaleString() || "unknown"} rows)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base truncate block max-w-[200px]" title={selectedDataset?.name}>
                           {selectedDataset?.name}
                        </CardTitle>
                        <CardDescription>{selectedDataset?.row_count?.toLocaleString()} rows</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDatasetId("")}>
                      Change
                    </Button>
                  </CardHeader>
                </Card>

                <GeneratorConfigForm
                  datasetId={selectedDatasetId}
                  datasetRowCount={selectedDataset?.row_count || 1000}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </>
            )}
          </div>

          {/* Sidebar Help */}
          <div className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle className="text-base">Training Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>1. <strong>Preprocessing:</strong> Data is encoded and normalized.</p>
                <p>2. <strong>Training:</strong> The neural network learns patterns (this may take minutes to hours).</p>
                <p>3. <strong>Generation:</strong> Once trained, you can generate unlimited synthetic samples.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
