"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GeneratorConfigForm, type GeneratorConfig } from "@/components/generators/generator-config-form"
import { ArrowLeft, Database } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock datasets
const mockDatasets = [
  { id: "d1", name: "patients.csv", row_count: 10000 },
  { id: "d2", name: "transactions.csv", row_count: 50000 },
  { id: "d3", name: "customers.json", row_count: 5000 },
]

export default function NewGeneratorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedDataset = searchParams.get("dataset")

  const [selectedDatasetId, setSelectedDatasetId] = React.useState(preselectedDataset || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const mockUser = { full_name: "John Doe", email: "john@example.com" }
  const selectedDataset = mockDatasets.find((d) => d.id === selectedDatasetId)

  const handleSubmit = async (config: GeneratorConfig) => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      router.push("/generators")
    }, 1500)
  }

  return (
    <AppShell user={mockUser}>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/generators">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generators
          </Link>
        </Button>
      </div>

      <PageHeader title="Create Generator" description="Configure and train a new synthetic data generator" />

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
                <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dataset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDatasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        <div className="flex items-center gap-2">
                          <span>{dataset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({dataset.row_count.toLocaleString()} rows)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      <CardTitle className="text-base">{selectedDataset?.name}</CardTitle>
                      <CardDescription>{selectedDataset?.row_count.toLocaleString()} rows</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDatasetId("")}>
                    Change
                  </Button>
                </CardHeader>
              </Card>

              <GeneratorConfigForm
                datasetId={selectedDatasetId}
                datasetRowCount={selectedDataset?.row_count}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Types</CardTitle>
              <CardDescription>Choose the right model for your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium">CTGAN / DP-CTGAN</p>
                <p className="text-muted-foreground text-xs">Best for mixed data types (categorical + numerical)</p>
              </div>
              <div>
                <p className="font-medium">TVAE / DP-TVAE</p>
                <p className="text-muted-foreground text-xs">Good for continuous numerical data</p>
              </div>
              <div>
                <p className="font-medium">TimeGAN</p>
                <p className="text-muted-foreground text-xs">Specialized for time-series data</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Privacy Guidance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-success">ε {"<"} 1</p>
                <p className="text-muted-foreground text-xs">Very strong privacy, lower utility</p>
              </div>
              <div>
                <p className="font-medium text-primary">ε = 1-10</p>
                <p className="text-muted-foreground text-xs">Good balance for most cases</p>
              </div>
              <div>
                <p className="font-medium text-warning-foreground">ε {">"} 10</p>
                <p className="text-muted-foreground text-xs">Higher utility, weaker privacy</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
