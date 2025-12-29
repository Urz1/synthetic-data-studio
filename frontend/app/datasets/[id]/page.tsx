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
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"

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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const { toast } = useToast()

  // Load data
  React.useEffect(() => {
    if (!id) return
    loadDatasetDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setIsDeleting(true)
      
      // Show deleting toast
      toast({
        title: `Deleting ${dataset?.name}...`,
        description: "Please wait while the dataset is being removed.",
      })
      
      await api.deleteDataset(id)
      
      toast({
        title: "Dataset deleted",
        description: `${dataset?.name} has been permanently removed.`,
      })
      
      // Navigate back to listing page
      router.push("/datasets")
    } catch (err) {
      toast({
        title: `Could not delete ${dataset?.name}`,
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const [isReprofiling, setIsReprofiling] = React.useState(false)

  const handleReprofile = async () => {
    try {
      setIsReprofiling(true)
      await api.profileDataset(id)
      toast({
        title: "Profiling started",
        description: "Dataset is being profiled. Results will appear shortly.",
      })
      // Reload data to get updated profile
      await loadDatasetDetails()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start profiling",
        variant: "destructive",
      })
    } finally {
      setIsReprofiling(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite" aria-busy="true">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading dataset details</span>
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
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Datasets</span>
            </Link>
          </Button>
        </div>

        <PageHeader
          title={dataset.name}
          description={`Uploaded on ${dataset.uploaded_at ? new Date(dataset.uploaded_at).toLocaleDateString() : 'Unknown'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleReprofile} disabled={isReprofiling}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isReprofiling ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isReprofiling ? 'Profiling...' : 'Re-profile'}</span>
            </Button>
            <Button asChild size="sm">
              <Link href={`/generators/new?dataset=${dataset.id}`}>
                <Zap className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create Generator</span>
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4 lg:space-y-0 lg:grid lg:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                <span className="font-mono text-sm">{dataset.column_count || Object.keys(dataset.schema_data || {}).length || 0}</span>
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
                  <div key={col} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-mono truncate flex-1 min-w-0" title={col}>{col}</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">{dtype}</code>
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
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Dataset
              </Button>
              
              <DeleteConfirmationDialog
                entityType="Dataset"
                entityName={dataset.name}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  </ProtectedRoute>
  )
}
