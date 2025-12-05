"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatasetProfileView } from "@/components/datasets/dataset-profile-view"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Download, Trash2, Zap, RefreshCw } from "lucide-react"
import type { Dataset } from "@/lib/types"

// Mock data
const mockDataset: Dataset = {
  id: "1",
  project_id: "p1",
  name: "patients.csv",
  original_filename: "patients.csv",
  size_bytes: 2457600,
  row_count: 10000,
  schema_data: {
    columns: ["id", "name", "age", "gender", "diagnosis", "ssn", "email"],
    dtypes: {
      id: "int64",
      name: "object",
      age: "int64",
      gender: "object",
      diagnosis: "object",
      ssn: "object",
      email: "object",
    },
  },
  status: "profiled",
  checksum: "sha256:abc123",
  pii_flags: {
    name: { pii_type: "PERSON_NAME", confidence: 0.95, sample_matches: ["John Smith", "Jane Doe", "Bob Wilson"] },
    ssn: { pii_type: "US_SSN", confidence: 0.99, sample_matches: ["***-**-1234", "***-**-5678"] },
    email: { pii_type: "EMAIL_ADDRESS", confidence: 0.98, sample_matches: ["john@example.com", "jane@test.org"] },
  },
  profiling_data: {
    row_count: 10000,
    column_count: 7,
    columns: {
      id: { type: "numeric", min: 1, max: 10000, mean: 5000.5, std: 2886.8, missing_count: 0, missing_percent: 0 },
      name: { type: "categorical", unique_count: 9876, missing_count: 0, missing_percent: 0 },
      age: { type: "numeric", min: 18, max: 95, mean: 45.3, std: 18.2, missing_count: 23, missing_percent: 0.23 },
      gender: {
        type: "categorical",
        unique_count: 3,
        top_values: { M: 4890, F: 5087, Other: 23 },
        missing_count: 0,
        missing_percent: 0,
      },
      diagnosis: { type: "categorical", unique_count: 156, missing_count: 0, missing_percent: 0 },
      ssn: { type: "text", unique_count: 10000, missing_count: 0, missing_percent: 0 },
      email: { type: "text", unique_count: 9998, missing_count: 2, missing_percent: 0.02 },
    },
  },
  version: 1,
  uploader_id: "user1",
  uploaded_at: "2024-12-10T10:00:00Z",
}

export default function DatasetDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const dataset = mockDataset // In production, fetch based on params.id

  const formatSize = (bytes?: number) => {
    if (!bytes) return "-"
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <AppShell user={user || { full_name: "", email: "" }}>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/datasets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Datasets
          </Link>
        </Button>
      </div>

      <PageHeader
        title={dataset.name}
        description={`Uploaded on ${new Date(dataset.uploaded_at).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-profile
            </Button>
            <Button asChild>
              <Link href={`/generators/new?dataset=${dataset.id}`}>
                <Zap className="mr-2 h-4 w-4" />
                Create Generator
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DatasetProfileView dataset={dataset} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dataset Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={dataset.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rows</span>
                <span className="font-mono text-sm">{dataset.row_count?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Columns</span>
                <span className="font-mono text-sm">{dataset.schema_data.columns.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="font-mono text-sm">{formatSize(dataset.size_bytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="font-mono text-sm">v{dataset.version}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Column Types</CardTitle>
              <CardDescription>Detected data types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(dataset.schema_data.dtypes).map(([col, dtype]) => (
                  <div key={col} className="flex items-center justify-between text-sm">
                    <span className="font-mono truncate max-w-[140px]">{col}</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{dtype}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-risk/20">
            <CardHeader>
              <CardTitle className="text-base text-risk">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Dataset
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
