"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, AlertCircle, Download, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { UsageRecord, Quota, BillingReport } from "@/lib/types"

// Mock data matching API spec
const mockUsageData: UsageRecord[] = [
  {
    id: "usage-1",
    user_id: "user1",
    resource_type: "generation",
    resource_id: "gen-123",
    quantity: 50000,
    unit: "rows",
    timestamp: "2024-12-03T14:30:00Z",
  },
  {
    id: "usage-2", 
    user_id: "user1",
    resource_type: "training",
    resource_id: "gen-124",
    quantity: 3600,
    unit: "seconds",
    timestamp: "2024-12-03T10:15:00Z",
  },
  {
    id: "usage-3",
    user_id: "user1",
    resource_type: "evaluation",
    resource_id: "eval-45",
    quantity: 2,
    unit: "count",
    timestamp: "2024-12-02T16:45:00Z",
  },
]

const mockQuotas: Quota[] = [
  {
    id: "quota-1",
    user_id: "user1",
    resource_type: "generation_rows",
    limit: 1000000,
    used: 450000,
    period: "monthly",
    reset_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "quota-2",
    user_id: "user1",
    resource_type: "training_hours",
    limit: 100,
    used: 42,
    period: "monthly",
    reset_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "quota-3",
    user_id: "user1",
    resource_type: "evaluations",
    limit: 50,
    used: 28,
    period: "monthly",
    reset_at: "2025-01-01T00:00:00Z",
  },
]

const mockBillingReport: BillingReport = {
  period_start: "2024-12-01T00:00:00Z",
  period_end: "2024-12-31T23:59:59Z",
  total_usage: {
    generation_rows: 450000,
    training_hours: 42,
    evaluations: 28,
  },
  estimated_cost: 127.50,
  currency: "USD",
}

export default function BillingPage() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "previous">("current")

  const usageColumns = [
    {
      key: "timestamp",
      header: "Date",
      accessor: (row: UsageRecord) => new Date(row.timestamp).toLocaleString(),
    },
    {
      key: "resource_type",
      header: "Type",
      accessor: (row: UsageRecord) => (
        <Badge variant="outline">{row.resource_type}</Badge>
      ),
    },
    {
      key: "quantity",
      header: "Usage",
      accessor: (row: UsageRecord) => `${row.quantity.toLocaleString()} ${row.unit}`,
    },
    {
      key: "resource_id",
      header: "Resource",
      accessor: (row: UsageRecord) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{row.resource_id}</code>
      ),
    },
  ]

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Billing & Usage"
          description="Monitor your usage, quotas, and billing details"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Change Period
              </Button>
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <MetricCard
            title="Estimated Cost"
            value={`$${mockBillingReport.estimated_cost.toFixed(2)}`}
            subtitle="Current billing period"
            icon={<DollarSign className="h-5 w-5" />}
            quality="neutral"
          />
          <MetricCard
            title="Total Rows Generated"
            value={mockBillingReport.total_usage.generation_rows.toLocaleString()}
            subtitle="This month"
            icon={<TrendingUp className="h-5 w-5" />}
            quality="good"
          />
          <MetricCard
            title="Training Hours"
            value={mockBillingReport.total_usage.training_hours}
            subtitle="Compute time used"
            icon={<AlertCircle className="h-5 w-5" />}
            quality="neutral"
          />
        </div>

        <Tabs defaultValue="usage" className="space-y-4">
          <TabsList>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="quotas">Quotas</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Usage</CardTitle>
                <CardDescription>Your resource consumption over time</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={mockUsageData}
                  columns={usageColumns}
                  keyExtractor={(row) => row.id}
                  compact
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotas" className="space-y-4">
            <div className="grid gap-4">
              {mockQuotas.map((quota) => {
                const percentUsed = (quota.used / quota.limit) * 100
                const isNearLimit = percentUsed > 80
                
                return (
                  <Card key={quota.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{quota.resource_type.replace(/_/g, " ")}</CardTitle>
                          <CardDescription>
                            {quota.used.toLocaleString()} / {quota.limit.toLocaleString()} used
                          </CardDescription>
                        </div>
                        <Badge variant={isNearLimit ? "destructive" : "secondary"}>
                          {percentUsed.toFixed(0)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isNearLimit ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Resets on {new Date(quota.reset_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Summary</CardTitle>
                <CardDescription>
                  {new Date(mockBillingReport.period_start).toLocaleDateString()} - 
                  {new Date(mockBillingReport.period_end).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Generation (rows)</span>
                    <span className="font-medium">{mockBillingReport.total_usage.generation_rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Training (hours)</span>
                    <span className="font-medium">{mockBillingReport.total_usage.training_hours}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Evaluations</span>
                    <span className="font-medium">{mockBillingReport.total_usage.evaluations}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-muted/50 px-3 rounded-lg mt-2">
                    <span className="font-semibold">Total Estimated Cost</span>
                    <span className="font-bold text-lg">${mockBillingReport.estimated_cost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
