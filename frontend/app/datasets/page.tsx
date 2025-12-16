"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader} from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatasetCard } from "@/components/datasets/dataset-card"
import { Plus, Search, Filter, Loader2 } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import type { Dataset } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"

export default function DatasetsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [datasets, setDatasets] = React.useState<Dataset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [datasetToDelete, setDatasetToDelete] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const { user } = useAuth()

  React.useEffect(() => {
    loadDatasets()
  }, [])

  async function loadDatasets() {
    try {
      setLoading(true)
      setError(null)
      // Get all datasets (backend will filter by user)
      const data = await api.listDatasets()
      setDatasets(Array.isArray(data) ? data : data.datasets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load datasets")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDatasetToDelete(id)
  }

  const confirmDelete = async () => {
    if (!datasetToDelete) return

    try {
      setIsDeleting(true)
      await api.deleteDataset(datasetToDelete)
      setDatasets(prev => prev.filter(d => d.id !== datasetToDelete))
      setDatasetToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dataset")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredDatasets = datasets.filter((dataset) => {
    const matchesSearch = dataset.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || dataset.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <ProtectedRoute>
    <AppShell user={user || { full_name: "", email: "" }}>
      <PageHeader
        title="Datasets"
        description="Manage your uploaded datasets for synthetic data generation"
        actions={
          <Button asChild>
            <Link href="/datasets/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Dataset
            </Link>
          </Button>
        }
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search datasets"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" aria-label="Filter by dataset status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="profiling">Profiling</SelectItem>
                  <SelectItem value="profiled">Profiled</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dataset Grid */}
          {filteredDatasets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDatasets.map((dataset) => (
                <DatasetCard 
                  key={dataset.id} 
                  dataset={dataset} 
                  onDelete={() => handleDeleteClick(dataset.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all" ? "No datasets match your filters" : "No datasets uploaded yet"}
              </p>
              {!search && statusFilter === "all" && (
                <Button asChild>
                  <Link href="/datasets/upload">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload your first dataset
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!datasetToDelete} onOpenChange={(open) => !open && setDatasetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your dataset and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
    </ProtectedRoute>
  )
}
