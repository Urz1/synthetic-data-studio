"use client"
import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DatasetProfileView } from "@/components/datasets/dataset-profile-view"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Download, Trash2, Zap, RefreshCw, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Dataset, Generator } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DatasetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params?.id as string

  // State
  const [dataset, setDataset] = React.useState<Dataset | null>(null)
  const [generators, setGenerators] = React.useState<Generator[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  // Load data
  React.useEffect(() => {
    if (!id) return
    loadDatasetDetails()
  }, [id])

  async function loadDatasetDetails() {
    try {
      setLoading(true)
      setError(null)

      // OPTIMIZED: Single API call for dataset + generators
      const data = await api.getDatasetDetails(id)
      
      setDataset(data.dataset)
      setGenerators(data.generators)
    } catch (err) {
      console.error("Failed to load dataset:", err)
      setError(err instanceof Error ? err.message : "Failed to load dataset")
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return "-"
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownload = async () => {
    try {
      const result = await api.downloadDataset(id)
      if (result.download_url) {
        // Create formatting anchor to trigger download
        const link = document.createElement('a');
        link.href = result.download_url;
        // Use filename from headers or fallback
        link.download = result.filename || "dataset.csv"; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: "Your download should begin shortly.",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to download dataset",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteDataset(id)
      toast({
        title: "Deleted",
        description: "Dataset has been deleted successfully.",
      })
      // Navigate back to listing page
      router.push("/datasets")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete dataset",
        variant: "destructive",
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Error state
  if (error || !dataset) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || "Dataset not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/datasets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Datasets
          </Button>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
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
          description={`Uploaded on ${dataset.uploaded_at ? new Date(dataset.uploaded_at).toLocaleDateString() : 'Unknown'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
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
                <span className="font-mono text-sm">{dataset.schema_data?.columns?.length || 0}</span>
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
                {dataset.schema_data?.dtypes && Object.entries(dataset.schema_data.dtypes).map(([col, dtype]) => (
                  <div key={col} className="flex items-center justify-between text-sm">
                    <span className="font-mono truncate max-w-[140px]">{col}</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{dtype}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Dataset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this dataset? This will also delete all associated generators and synthetic datasets. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  </ProtectedRoute>
  )
}
