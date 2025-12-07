"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Download, FileText, Trash2, File, Calendar, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { Export } from "@/lib/types"

// Mock exports data
const mockExports: Export[] = [
  {
    id: "export-1",
    generator_id: "gen-123",
    export_type: "model_card",
    format: "pdf",
    status: "completed",
    download_url: "https://example.com/exports/model-card-gen-123.pdf",
    created_at: "2024-12-03T14:30:00Z",
    expires_at: "2024-12-10T14:30:00Z",
  },
  {
    id: "export-2",
    generator_id: "gen-456",
    export_type: "privacy_report",
    format: "docx",
    status: "completed",
    download_url: "https://example.com/exports/privacy-report-gen-456.docx",
    created_at: "2024-12-03T10:15:00Z",
    expires_at: "2024-12-10T10:15:00Z",
  },
  {
    id: "export-3",
    dataset_id: "ds-789",
    export_type: "dataset",
    format: "csv",
    status: "completed",
    download_url: "https://example.com/exports/dataset-ds-789.csv",
    created_at: "2024-12-02T16:45:00Z",
    expires_at: "2024-12-09T16:45:00Z",
  },
  {
    id: "export-4",
    generator_id: "gen-789",
    export_type: "model_card",
    format: "pdf",
    status: "pending",
    created_at: "2024-12-03T15:00:00Z",
    expires_at: "2024-12-10T15:00:00Z",
  },
  {
    id: "export-5",
    dataset_id: "ds-old",
    export_type: "dataset",
    format: "json",
    status: "failed",
    created_at: "2024-12-01T08:00:00Z",
    expires_at: "2024-12-08T08:00:00Z",
  },
]

export default function ExportsPage() {
  const { user } = useAuth()
  const [exports, setExports] = useState(mockExports)

  const handleDownload = (exportItem: Export) => {
    if (exportItem.download_url) {
      window.open(exportItem.download_url, "_blank")
    }
  }

  const handleDelete = (exportId: string) => {
    setExports(exports.filter(e => e.id !== exportId))
  }

  const getExportIcon = (type: Export["export_type"]) => {
    switch (type) {
      case "model_card":
        return <FileText className="h-4 w-4" />
      case "privacy_report":
        return <File className="h-4 w-4" />
      case "dataset":
        return <Download className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: Export["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const exportsColumns = [
    {
      key: "type",
      header: "Type",
      accessor: (row: Export) => (
        <div className="flex items-center gap-2">
          {getExportIcon(row.export_type)}
          <span className="text-sm">{row.export_type.replace(/_/g, " ")}</span>
        </div>
      ),
    },
    {
      key: "format",
      header: "Format",
      accessor: (row: Export) => (
        <Badge variant="outline">{row.format.toUpperCase()}</Badge>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      accessor: (row: Export) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.generator_id || row.dataset_id || "N/A"}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row: Export) => getStatusBadge(row.status),
    },
    {
      key: "created",
      header: "Created",
      accessor: (row: Export) => (
        <div className="text-sm">
          <div>{new Date(row.created_at).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(row.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: "expires",
      header: "Expires",
      accessor: (row: Export) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(row.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        const isExpiringSoon = daysUntilExpiry <= 2

        return (
          <div className="flex items-center gap-2">
            <Calendar className={`h-3 w-3 ${isExpiringSoon ? "text-destructive" : ""}`} />
            <span className={`text-sm ${isExpiringSoon ? "text-destructive" : ""}`}>
              {daysUntilExpiry}d
            </span>
          </div>
        )
      },
    },
  ]

  const stats = {
    total: exports.length,
    completed: exports.filter(e => e.status === "completed").length,
    pending: exports.filter(e => e.status === "pending").length,
    failed: exports.filter(e => e.status === "failed").length,
  }

  return (
    <ProtectedRoute requireAdmin>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Exports"
          description="Manage your exported files and documents"
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-500">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-500">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Exports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>All your generated exports and downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={exports}
              columns={exportsColumns}
              keyExtractor={(row) => row.id}
              compact
              emptyMessage="No exports yet"
              rowActions={[
                {
                  label: "Download",
                  icon: <Download className="h-4 w-4" />,
                  onClick: handleDownload,
                },
                {
                  label: "Delete",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: (row: { id: string }) => handleDelete(row.id),
                  variant: "destructive" as const,
                },
              ].filter((action) => {
                // Only show download for completed exports
                if (action.label === "Download") {
                  return true // Will be handled by checking status in onClick
                }
                return true
              })}
            />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Export Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Exports are automatically deleted after 7 days</p>
            <p>• Download links are temporary and expire with the export</p>
            <p>• Failed exports can be retried from the original resource page</p>
            <p>• Large exports may take several minutes to generate</p>
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
