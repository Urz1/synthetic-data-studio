"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EvaluationCard } from "@/components/evaluations/evaluation-card"
import { Plus, Search, Filter, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEvaluations } from "@/lib/hooks"
import { api } from "@/lib/api"
import type { Evaluation } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/layout/protected-route"
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

export default function EvaluationsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [evaluationToDelete, setEvaluationToDelete] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // TanStack Query for data fetching with caching
  const { data: evaluationsData, isLoading: loading, error: queryError, refetch } = useEvaluations()
  
  const evaluations = React.useMemo(() => {
    if (!evaluationsData) return []
    if (Array.isArray(evaluationsData)) {
      return evaluationsData as Evaluation[]
    } else if (evaluationsData && Array.isArray((evaluationsData as any).evaluations)) {
      return (evaluationsData as any).evaluations as Evaluation[]
    }
    return []
  }, [evaluationsData])

  const error = queryError ? (
    queryError instanceof Error 
      ? (queryError.message === "Failed to fetch" || queryError.message.includes("NetworkError")
          ? "Unable to connect to server. Please check your connection and try again."
          : queryError.message)
      : "Failed to load evaluations"
  ) : null

  async function handleDelete(id: string) {
    try {
      setDeleting(true)
      await api.deleteEvaluation(id)
      toast({
        title: "Deleted",
        description: "Evaluation has been deleted successfully.",
      })
      // TanStack Query will refetch
      refetch()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete evaluation",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setEvaluationToDelete(null)
    }
  }

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch = evaluation.generator_id?.toLowerCase().includes(search.toLowerCase()) || false
    const matchesStatus = statusFilter === "all" || evaluation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <ProtectedRoute>
    <AppShell user={user || { full_name: "", email: "" }}>
      <PageHeader
        title="Evaluations"
        description="View and compare synthetic data quality evaluations"
        actions={
          <Button asChild>
            <Link href="/evaluations/new">
              <Plus className="mr-2 h-4 w-4" />
              New Evaluation
            </Link>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading evaluations</span>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by generator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search evaluations by generator"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]" aria-label="Filter evaluations by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {filteredEvaluations.length} evaluation{filteredEvaluations.length === 1 ? "" : "s"}
        {search ? ` matching "${search}"` : ""}
        {statusFilter !== "all" ? ` with status ${statusFilter}` : ""}.
      </p>

      {/* Evaluations Grid */}
      {filteredEvaluations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {filteredEvaluations.map((evaluation) => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              onDelete={() => {
                setEvaluationToDelete(evaluation.id)
                setDeleteDialogOpen(true)
              }}
              onExport={() => {
                if (evaluation.report) {
                  const dataStr = JSON.stringify(evaluation.report, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `evaluation-${evaluation.id}.json`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                  toast({
                    title: "Export Complete",
                    description: "Evaluation report has been downloaded",
                  })
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12" role="status" aria-live="polite">
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== "all" ? "No evaluations match your filters" : "No evaluations run yet"}
          </p>
          {!search && statusFilter === "all" && (
            <Button asChild>
              <Link href="/evaluations/new">
                <Plus className="mr-2 h-4 w-4" />
                Run your first evaluation
              </Link>
            </Button>
          )}
        </div>
      )}
      </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evaluation? It will be archived but can be recovered by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => evaluationToDelete && handleDelete(evaluationToDelete)}
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
