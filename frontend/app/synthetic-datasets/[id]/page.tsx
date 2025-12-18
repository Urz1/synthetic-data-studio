"use client"
import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Loader2, Zap, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import type { SyntheticDataset, Generator } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"

export default function SyntheticDatasetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params?.id as string

  // State
  const [dataset, setDataset] = React.useState<SyntheticDataset | null>(null)
  const [generator, setGenerator] = React.useState<Generator | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const { toast } = useToast()

  // Load data
  React.useEffect(() => {
    if (!id) return
    loadSyntheticDatasetDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const [downloading, setDownloading] = React.useState(false)

  async function loadSyntheticDatasetDetails() {
    try {
      setLoading(true)
      setError(null)

      const data = await api.getSyntheticDatasetDetails(id)
      
      setDataset(data.dataset)
      setGenerator(data.generator)
    } catch (err) {
      console.error("Failed to load synthetic dataset:", err)
      setError("Failed to load synthetic dataset details")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      toast({
        title: `Deleting ${dataset?.name}...`,
        description: "Please wait while the dataset is being removed.",
      })
      
      await api.deleteSyntheticDataset(id)
      
      toast({
        title: "Synthetic Dataset deleted",
        description: `${dataset?.name} has been permanently removed.`,
      })
      
      router.push("/synthetic-datasets")
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

  const handleDownload = async () => {
    if (!dataset) return
    
    setDownloading(true)
    try {
      const result = await api.downloadSyntheticDataset(id)
      if (result.download_url) {
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = result.filename || "synthetic_dataset.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Your file is being downloaded",
        })
      }
    } catch (err) {
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : "Failed to download dataset",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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
            <AlertDescription>{error || "Synthetic dataset not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/synthetic-datasets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Synthetic Datasets
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
            <Link href="/synthetic-datasets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Synthetic Datasets
            </Link>
          </Button>
        </div>

        <PageHeader
          title={dataset.name}
          description={`Generated ${dataset.uploaded_at ? new Date(dataset.uploaded_at).toLocaleDateString() : 'Unknown'}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {downloading ? "Downloading..." : "Download"}
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Rows</p>
                    <p className="text-2xl font-bold">{dataset.row_count?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="text-2xl font-bold">{formatBytes(dataset.size_bytes)}</p>
                  </div>
                </div>
                {dataset.schema_data?.columns && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Columns ({dataset.schema_data.columns.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {dataset.schema_data.columns.map((col) => (
                        <Badge key={col} variant="outline">{col}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {generator && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generated By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <Link href={`/generators/${generator.id}`} className="text-sm text-primary hover:underline">
                      {generator.name}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Type: {generator.type}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <code className="text-xs">{dataset.id.slice(0, 12)}...</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{dataset.uploaded_at ? new Date(dataset.uploaded_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
                {dataset.status && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary">{dataset.status}</Badge>
                  </div>
                )}
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
                  Delete Synthetic Dataset
                </Button>
                
                <DeleteConfirmationDialog
                  entityType="Synthetic Dataset"
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
