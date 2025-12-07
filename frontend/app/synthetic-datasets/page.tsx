"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Search, Loader2, Database, Calendar, FileText, Boxes, MoreVertical, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import type { SyntheticDataset } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SyntheticDatasetsPage() {
  const [search, setSearch] = React.useState("")
  const [datasets, setDatasets] = React.useState<SyntheticDataset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [datasetToDelete, setDatasetToDelete] = React.useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  React.useEffect(() => {
    loadSyntheticDatasets()
  }, [])

  async function loadSyntheticDatasets() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.listSyntheticDatasets()
      setDatasets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load synthetic datasets")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteSyntheticDataset(id)
      toast({
        title: "Deleted",
        description: "Synthetic dataset has been deleted successfully.",
      })
      // Refresh the list
      await loadSyntheticDatasets()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete synthetic dataset",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDatasetToDelete(null)
    }
  }

  async function handleDownload(id: string) {
    try {
      const result = await api.downloadSyntheticDataset(id)
      if (result.download_url) {
        window.open(result.download_url, "_blank")
        toast({
          title: "Download started",
          description: "Your download should begin shortly.",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to download synthetic dataset",
        variant: "destructive",
      })
    }
  }

  const filteredDatasets = datasets.filter((dataset) =>
    dataset.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Synthetic Datasets"
          description="Generated datasets from your trained models"
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search synthetic datasets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Datasets Grid */}
            {filteredDatasets.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDatasets.map((dataset) => (
                  <Card key={dataset.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Boxes className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate" title={dataset.name}>
                              {dataset.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {(dataset.row_count || 0).toLocaleString()} rows
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/synthetic-datasets/${dataset.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(dataset.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDatasetToDelete(dataset.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Database className="h-4 w-4" />
                        <span>{formatBytes(dataset.size_bytes)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(dataset.uploaded_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Boxes className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {search
                    ? "No synthetic datasets match your search"
                    : "No synthetic datasets generated yet"}
                </p>
                {!search && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Train a generator to create synthetic datasets
                  </p>
                )}
                <Button asChild>
                  <Link href="/generators">
                    View Generators
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Synthetic Dataset</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this synthetic dataset? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => datasetToDelete && handleDelete(datasetToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppShell>
    </ProtectedRoute>
  )
}
