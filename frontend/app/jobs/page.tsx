"use client"

import React, { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Progress } from "@/components/ui/progress"
import { Activity, CheckCircle, XCircle, Clock, Loader2, RotateCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { Job } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function JobsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const fetchJobs = async () => {
    try {
      let jobsData = await api.listJobs()
      // If not admin, filter jobs to only those initiated by current user
      if (user?.role !== "admin" && user?.id) {
        jobsData = jobsData.filter(j => j.created_by === user.id)
      }
      setJobs(jobsData)
      setError("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load jobs"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    
    // Auto-refresh every 5 seconds for running jobs
    const interval = setInterval(() => {
      if (jobs.some(j => j.status === "running" || j.status === "pending")) {
        fetchJobs()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    fetchJobs()
  }

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: Job["status"]) => {
    const variants = {
      completed: "default" as const,
      running: "secondary" as const,
      pending: "outline" as const,
      failed: "destructive" as const,
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getDuration = (job: Job) => {
    if (!job.started_at) return "Not started"
    
    const end = job.completed_at ? new Date(job.completed_at) : new Date()
    const start = new Date(job.started_at)
    const durationMs = end.getTime() - start.getTime()
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  const jobColumns = [
    {
      key: "status",
      header: "Status",
      accessor: (row: Job) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.status)}
          {getStatusBadge(row.status)}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      accessor: (row: Job) => (
        <Badge variant="outline">{row.type}</Badge>
      ),
    },
    {
      key: "id",
      header: "Job ID",
      accessor: (row: Job) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{row.id}</code>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      accessor: (row: Job) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.generator_id || row.dataset_id || "N/A"}
        </code>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      accessor: (row: Job) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={row.progress} className="h-2" />
          <span className="text-xs text-muted-foreground">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      accessor: (row: Job) => (
        <span className="text-sm">{getDuration(row)}</span>
      ),
    },
    {
      key: "created",
      header: "Created",
      accessor: (row: Job) => (
        <div className="text-sm">
          <div>{new Date(row.created_at).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(row.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
  ]

  const stats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === "running").length,
    completed: jobs.filter(j => j.status === "completed").length,
    failed: jobs.filter(j => j.status === "failed").length,
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Jobs"
          description="Monitor background tasks and long-running operations"
          actions={
            <Button size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RotateCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        {isLoading && jobs.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        ) : error && jobs.length === 0 ? (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                Running
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.running}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Job Queue</CardTitle>
            <CardDescription>All background jobs and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={jobs}
              columns={jobColumns}
              keyExtractor={(row) => row.id}
              compact
              emptyMessage="No jobs running"
            />
          </CardContent>
        </Card>

        {/* Failed Jobs Details */}
        {stats.failed > 0 && (
          <Card className="mt-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Failed Jobs</CardTitle>
              <CardDescription>Review errors and retry if needed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.filter(j => j.status === "failed").map((job) => (
                <div key={job.id} className="p-4 bg-destructive/10 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{job.id}</code>
                    <Badge variant="destructive">{job.type}</Badge>
                  </div>
                  {job.error_message && (
                    <p className="text-sm text-destructive font-mono">{job.error_message}</p>
                  )}
                  <Button size="sm" variant="outline">
                    <RotateCw className="mr-2 h-3 w-3" />
                    Retry Job
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}
