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
import { api } from "@/lib/api"
import type { Evaluation } from "@/lib/types"
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
} from "@/components/ui/alert-dialog"

export default function EvaluationsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [evaluationToDelete, setEvaluationToDelete] = React.useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  React.useEffect(() => {
    loadEvaluations()
  }, [])

  async function loadEvaluations() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.listEvaluations()

      if (Array.isArray(data)) {
        setEvaluations(data as Evaluation[])
      } else if (data && Array.isArray((data as any).evaluations)) {
        setEvaluations((data as any).evaluations as Evaluation[])
      } else {
        setEvaluations([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evaluations")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteEvaluation(id)
      toast({
        title: "Deleted",
        description: "Evaluation has been deleted successfully.",
      })
      // Refresh the list
      await loadEvaluations()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete evaluation",
        variant: "destructive",
      })
    } finally {
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            placeholder="Search by generator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
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

      {/* Evaluations Grid */}
      {filteredEvaluations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
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
              Are you sure you want to delete this evaluation? This action cannot be undone.
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
  )
}
