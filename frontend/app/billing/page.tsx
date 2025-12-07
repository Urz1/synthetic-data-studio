"use client"

import React, { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, AlertCircle, Download, Calendar, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { UsageRecord, Quota, BillingReport } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function BillingPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [usageData, setUsageData] = useState<UsageRecord[]>([])
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [billingReport, setBillingReport] = useState<BillingReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError("")
      try {
        // OPTIMIZED: Single API call replaces 3 separate calls (listUsage, listQuotas, getBillingReport)
        const summary = await api.getBillingSummary({ limit: 100 })
        setUsageData(summary.usage_records)
        setQuotas(summary.quotas)
        // Create billing report structure from summary
        setBillingReport({
          project_id: "",
          period_start: summary.summary.period_start || "",
          period_end: summary.summary.period_end || "",
          usage_summary: {
            total_records: summary.summary.total_records,
            total_quantity: summary.summary.total_quantity,
          },
          quota_status: summary.quotas,
          total_cost_estimate: 0,
        } as any)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load billing data"
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

    fetchData()
  }, [toast])

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
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Calendar className="mr-2 h-4 w-4" />
                Change Period
              </Button>
              <Button size="sm" disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading billing data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <MetricCard
                title="Estimated Cost"
                value={billingReport ? `$${billingReport.estimated_cost.toFixed(2)}` : "$0.00"}
                subtitle="Current billing period"
                icon={<DollarSign className="h-5 w-5" />}
                quality="neutral"
              />
              <MetricCard
                title="Total Rows Generated"
                value={billingReport?.total_usage?.generation_rows?.toLocaleString() ?? "0"}
                subtitle="This month"
                icon={<TrendingUp className="h-5 w-5" />}
                quality="good"
              />
              <MetricCard
                title="Training Hours"
                value={billingReport?.total_usage?.training_hours ?? 0}
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
                    {usageData.length > 0 ? (
                      <DataTable
                        data={usageData}
                        columns={usageColumns}
                        keyExtractor={(row) => row.id}
                        compact
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No usage data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quotas" className="space-y-4">
                {quotas.length > 0 ? (
                  <div className="grid gap-4">
                    {quotas.map((quota) => {
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No quotas configured
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                {billingReport ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Summary</CardTitle>
                      <CardDescription>
                        {new Date(billingReport.period_start).toLocaleDateString()} - 
                        {new Date(billingReport.period_end).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">Generation (rows)</span>
                          <span className="font-medium">{billingReport.total_usage?.generation_rows?.toLocaleString() ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">Training (hours)</span>
                          <span className="font-medium">{billingReport.total_usage?.training_hours ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm">Evaluations</span>
                          <span className="font-medium">{billingReport.total_usage?.evaluations ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-muted/50 px-3 rounded-lg mt-2">
                          <span className="font-semibold">Total Estimated Cost</span>
                          <span className="font-bold text-lg">${billingReport.estimated_cost.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No billing report available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}
