"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Activity, AlertTriangle, Search, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { AuditLog, AuditStats } from "@/lib/types"

// Mock audit logs data
const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-1",
    user_id: "user1",
    action: "generator.create",
    resource_type: "generator",
    resource_id: "gen-123",
    details: { model_type: "dp-ctgan", dataset_id: "ds-456" },
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0...",
    timestamp: "2024-12-03T14:30:00Z",
  },
  {
    id: "audit-2",
    user_id: "user1",
    action: "dataset.upload",
    resource_type: "dataset",
    resource_id: "ds-789",
    details: { filename: "customers.csv", size_bytes: 1024000 },
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0...",
    timestamp: "2024-12-03T10:15:00Z",
  },
  {
    id: "audit-3",
    user_id: "user2",
    action: "auth.login",
    resource_type: "user",
    resource_id: "user2",
    details: { method: "email" },
    ip_address: "192.168.1.105",
    user_agent: "Mozilla/5.0...",
    timestamp: "2024-12-03T09:00:00Z",
  },
  {
    id: "audit-4",
    user_id: "user1",
    action: "generator.delete",
    resource_type: "generator",
    resource_id: "gen-old",
    details: { reason: "user_requested" },
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0...",
    timestamp: "2024-12-02T16:45:00Z",
  },
]

const mockAuditStats: AuditStats = {
  total_events: 1247,
  events_by_type: {
    "generator.create": 45,
    "dataset.upload": 89,
    "auth.login": 234,
    "evaluation.run": 67,
    "generator.delete": 12,
  },
  events_by_user: {
    user1: 678,
    user2: 345,
    user3: 224,
  },
  recent_failures: 3,
}

export default function AuditPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = search === "" || 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource_id.toLowerCase().includes(search.toLowerCase())
    
    const matchesAction = actionFilter === "all" || log.action.startsWith(actionFilter)

    return matchesSearch && matchesAction
  })

  const auditColumns = [
    {
      key: "timestamp",
      header: "Time",
      accessor: (row: AuditLog) => (
        <div className="text-sm">
          <div>{new Date(row.timestamp).toLocaleTimeString()}</div>
          <div className="text-xs text-muted-foreground">{new Date(row.timestamp).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      accessor: (row: AuditLog) => {
        const actionType = row.action.split(".")[0]
        const actionVariant = row.action.includes("delete") || row.action.includes("failure") 
          ? "destructive" 
          : row.action.includes("create") || row.action.includes("upload")
          ? "default"
          : "secondary"
        
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={actionVariant}>{row.action}</Badge>
          </div>
        )
      },
    },
    {
      key: "resource",
      header: "Resource",
      accessor: (row: AuditLog) => (
        <div className="text-sm">
          <div className="font-medium">{row.resource_type}</div>
          <code className="text-xs bg-muted px-1 rounded">{row.resource_id}</code>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      accessor: (row: AuditLog) => (
        <div className="text-sm">
          <div>{row.user_id}</div>
          <div className="text-xs text-muted-foreground">{row.ip_address}</div>
        </div>
      ),
    },
  ]

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("failure")) return "text-destructive"
    if (action.includes("create") || action.includes("upload")) return "text-success"
    return "text-primary"
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Audit Logs"
          description="Monitor user activities and system events"
          actions={
            <Button size="sm">
              <Shield className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          }
        />

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <MetricCard
            title="Total Events"
            value={mockAuditStats.total_events}
            subtitle="All time"
            icon={<Activity className="h-5 w-5" />}
            quality="neutral"
          />
          <MetricCard
            title="Recent Failures"
            value={mockAuditStats.recent_failures}
            subtitle="Last 24 hours"
            icon={<AlertTriangle className="h-5 w-5" />}
            quality={mockAuditStats.recent_failures > 5 ? "poor" : "good"}
          />
          <MetricCard
            title="Login Events"
            value={mockAuditStats.events_by_type["auth.login"]}
            subtitle="This month"
            icon={<Shield className="h-5 w-5" />}
            quality="neutral"
          />
          <MetricCard
            title="Generator Actions"
            value={mockAuditStats.events_by_type["generator.create"]}
            subtitle="Created this month"
            icon={<Activity className="h-5 w-5" />}
            quality="good"
          />
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by action or resource..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="generator">Generator</SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Chronological record of all system events</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredLogs}
              columns={auditColumns}
              keyExtractor={(row) => row.id}
              compact
              emptyMessage="No audit logs found"
            />
          </CardContent>
        </Card>

        {/* Top Users Card */}
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Actions</CardTitle>
              <CardDescription>Most frequent event types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(mockAuditStats.events_by_type)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getActionColor(action)}`}>
                        {action}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Users</CardTitle>
              <CardDescription>Most active users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(mockAuditStats.events_by_user)
                  .sort((a, b) => b[1] - a[1])
                  .map(([userId, count]) => (
                    <div key={userId} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{userId}</span>
                      <Badge variant="secondary">{count} events</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
