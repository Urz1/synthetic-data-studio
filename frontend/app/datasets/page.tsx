"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader} from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatasetCard } from "@/components/datasets/dataset-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Filter, Database, RefreshCw } from "lucide-react"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { useDeleteWithProgress } from "@/hooks/use-delete-with-progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDatasets, useDeleteDataset } from "@/lib/hooks"
import { api } from "@/lib/api"
import type { Dataset } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"
import { cn } from "@/lib/utils"

export default function DatasetsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [datasetToDelete, setDatasetToDelete] = React.useState<Dataset | null>(null)
  const { user } = useAuth()

  // TanStack Query for data fetching with caching
  const { data: datasetsData, isLoading: loading, error: queryError, refetch } = useDatasets()
  const datasets = React.useMemo(() => {
    if (!datasetsData) return []
    return Array.isArray(datasetsData) ? datasetsData : datasetsData.datasets || []
  }, [datasetsData])
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load datasets") : null

  // Delete mutation with cache invalidation
  const deleteDatasetMutation = useDeleteDataset()

  // Delete hook with progress tracking
  const { isDeleting, isGhostId, startDelete } = useDeleteWithProgress({
    entityType: "Dataset",
    onSuccess: (id) => {
      // No need to manually remove from state - TanStack Query will refetch
      setDatasetToDelete(null)
    },
    onError: () => {
      setDatasetToDelete(null)
    },
  })

  const handleDeleteClick = (dataset: Dataset) => {
    setDatasetToDelete(dataset)
  }

  const handleConfirmDelete = async () => {
    if (!datasetToDelete) return
    
    await startDelete(
      datasetToDelete.id,
      datasetToDelete.name,
      () => api.deleteDataset(datasetToDelete.id)
    )
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
          <AlertDescription className="flex items-center justify-between gap-3">
            <span className="break-words">{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <DatasetsSkeleton />
      ) : (
        <>
          {/* Filters */}
          <Card className="mb-6 bg-card/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Find datasets</CardTitle>
              <CardDescription>Search by name and filter by status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                    <SelectTrigger className="w-[160px]" aria-label="Filter by dataset status">
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
            </CardContent>
          </Card>

          {/* Dataset Grid */}
          {filteredDatasets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDatasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={cn(isGhostId(dataset.id) && "deleting-ghost")}
                >
                  <DatasetCard 
                    dataset={dataset} 
                    onDelete={() => handleDeleteClick(dataset)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-card/40">
              <CardContent className="py-12">
                <div className="mx-auto max-w-md text-center space-y-4">
                  <div className="mx-auto w-fit rounded-2xl bg-primary/10 p-3">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {search || statusFilter !== "all" ? "No datasets match your filters" : "No datasets yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter !== "all"
                        ? "Try a different keyword or clear the status filter."
                        : "Upload a dataset to start profiling and training generators."}
                    </p>
                  </div>
                  {!search && statusFilter === "all" && (
                    <Button asChild>
                      <Link href="/datasets/upload">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload your first dataset
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        entityType="Dataset"
        entityName={datasetToDelete?.name}
        open={!!datasetToDelete}
        onOpenChange={(open) => !open && setDatasetToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </AppShell>
    </ProtectedRoute>
  )
}

function DatasetsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-card/40">
        <CardHeader className="pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
