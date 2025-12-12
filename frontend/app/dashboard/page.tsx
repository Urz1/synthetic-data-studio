"use client"

import React, { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EpsilonBadge } from "@/components/ui/epsilon-badge"
import { DataTable } from "@/components/ui/data-table"
import { ActivityFeed } from "@/components/ui/activity-feed"
import { Badge } from "@/components/ui/badge"
import { ShowMore } from "@/components/ui/show-more"
import { ContextualTip } from "@/components/ui/contextual-tip"
import { Plus, Database, Zap, FileBarChart, ArrowRight, Layers, Eye, Download, Play, BarChart3, Activity, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { Generator, Dataset, Evaluation } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const generatorColumns = [
  {
    key: "name",
    header: "Generator",
    accessor: (row: Generator) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    key: "type",
    header: "Model",
    accessor: (row: Generator) => <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono">{row.type}</code>,
  },
  {
    key: "privacy",
    header: "Privacy",
    accessor: (row: Generator) => (
      <EpsilonBadge
        epsilon={row.privacy_spent?.epsilon ?? row.privacy_config?.target_epsilon}
        delta={row.privacy_spent?.delta ?? row.privacy_config?.target_delta}
        size="sm"
        showLabel={false}
      />
    ),
  },
  {
    key: "status",
    header: "Status",
    accessor: (row: Generator) => <StatusBadge status={row.status} size="sm" />,
    align: "right" as const,
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [stats, setStats] = useState({
    total_datasets: 0,
    total_generators: 0,
    active_generators: 0,
    total_evaluations: 0,
    completed_evaluations: 0,
    avg_privacy_score: 0,
  })
  const [recentGenerators, setRecentGenerators] = useState<Generator[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError("")
      try {
        // Try optimized endpoint first
        try {
          const summary = await api.getDashboardSummary()
          setStats(summary.stats)
          setRecentGenerators(summary.recent_generators)
          setActivities(summary.recent_activities)
        } catch (apiError: any) {
          // Fallback to individual API calls if dashboard endpoint not available (404)
          // This happens if backend hasn't been restarted after adding new routes
          if (apiError?.message?.includes("404") || apiError?.message?.includes("Not Found")) {
            if (process.env.NODE_ENV === 'development') {
              console.warn("Dashboard summary endpoint not available, falling back to individual calls");
            }
            
            const apiCalls: Promise<any>[] = [
              api.listDatasets().catch(() => []),
              api.listGenerators().catch(() => []),
              api.listEvaluations().catch(() => []),
            ]
            
            if (isAdmin) {
              apiCalls.push(api.listAuditLogs(0, 5).catch(() => ({ logs: [], total: 0 })))
            }
            
            const results = await Promise.all(apiCalls)
            const datasetsData = results[0] as any[]
            const generatorsData = results[1] as any[]
            const evaluationsData = results[2] as any[]
            const auditLogsData = isAdmin ? results[3] as { logs: any[], total: number } : undefined
            
            // Calculate stats from fetched data
            const calculatedStats = {
              total_datasets: (datasetsData as any[]).length,
              total_generators: (generatorsData as any[]).length,
              active_generators: (generatorsData as any[]).filter(g => g.status === "training" || g.status === "pending").length,
              total_evaluations: (evaluationsData as any[]).length,
              completed_evaluations: (evaluationsData as any[]).filter(e => e.status === "completed").length,
              avg_privacy_score: (evaluationsData as any[]).length > 0
                ? (evaluationsData as any[]).reduce((acc, e) => acc + (e.summary?.overall_score ?? 0), 0) / (evaluationsData as any[]).length
                : 0,
            }
            
            setStats(calculatedStats)
            setRecentGenerators((generatorsData as any[]).slice(0, 5))
            setActivities(isAdmin && auditLogsData ? ((auditLogsData as any).logs || []) : [])
          } else {
            throw apiError
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data"
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

    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount - toast is not a stable dependency

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
      <PageHeader
        title="Dashboard"
        description="Overview of your synthetic data generation activities"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/generators">View Generators</Link>
            </Button>
            <Button asChild>
              <Link href="/datasets/upload">
                <Plus className="mr-2 h-4 w-4" />
                New Dataset
              </Link>
            </Button>
          </div>
        }
      />

      {/* Contextual Tip - Progressive Disclosure */}
      <ContextualTip id="dashboard-tip" variant="info" className="mb-6">
        <strong>Pro tip:</strong> Your most important metrics are shown above. Click &quot;Show Activity Feed&quot; below to see your full audit trail and quick actions.
      </ContextualTip>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Grid - Always visible (20% that delivers 80% value) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 stagger-children">
            <MetricCard
              title="Total Datasets"
              value={stats.total_datasets}
              icon={<Database className="h-5 w-5" />}
              quality="neutral"
            />
            <MetricCard
              title="Active Generators"
              value={stats.active_generators}
              subtitle="Currently training"
              icon={<Zap className="h-5 w-5" />}
              quality="neutral"
            />
            <MetricCard
              title="Evaluations"
              value={stats.completed_evaluations}
              subtitle="Completed"
              icon={<FileBarChart className="h-5 w-5" />}
              quality="good"
            />
            <MetricCard
              title="Avg Privacy Score"
              value={stats.avg_privacy_score > 0 ? `${(stats.avg_privacy_score * 100).toFixed(0)}%` : "N/A"}
              tooltip="Average privacy score across all evaluations"
              quality="good"
            />
          </div>

      {/* Recent Generators - Always visible */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-medium">Recent Generators</CardTitle>
            <CardDescription>Your latest synthetic data generators</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/generators">
              View all
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable
            data={recentGenerators.slice(0, 3)}
            columns={generatorColumns}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => router.push(`/generators/${row.id}`)}
            compact
            emptyMessage="No generators yet"
            emptyIcon={<Zap className="h-10 w-10" />}
          />
        </CardContent>
      </Card>

      {/* Progressive Disclosure: Activity Feed and Quick Actions */}
      <ShowMore label="Show Activity Feed & Quick Actions" defaultOpen={false}>
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* Activity Feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                <Badge variant="secondary" className="font-normal flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ActivityFeed 
                activities={activities.map(log => ({
                  id: log.id,
                  type: log.action?.replace("_", "_") as any || "dataset_uploaded",
                  title: log.action?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Activity",
                  description: log.details || `Action on ${log.resource_type} ${log.resource_id}`,
                  timestamp: log.timestamp,
                }))} 
                maxItems={5} 
              />
            </CardContent>
          </Card>

          {/* Generator Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Generator Actions</CardTitle>
              <CardDescription>Quick actions for recent generators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentGenerators.length > 0 ? (
                recentGenerators.slice(0, 3).map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium truncate">{gen.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => router.push(`/generators/${gen.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No generators yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
            <CardDescription>Common workflows to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickActionCard
                href="/datasets/upload"
                icon={<Database className="h-5 w-5" />}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                title="Upload Dataset"
                description="Start with your data"
              />
              <QuickActionCard
                href="/generators/new"
                icon={<Zap className="h-5 w-5" />}
                iconColor="text-success"
                iconBg="bg-success/10"
                title="Create Generator"
                description="Train a new model"
              />
              <QuickActionCard
                href="/evaluations/new"
                icon={<BarChart3 className="h-5 w-5" />}
                iconColor="text-warning-foreground"
                iconBg="bg-warning/10"
                title="Run Evaluation"
                description="Assess data quality"
              />
              <QuickActionCard
                href="/projects/new"
                icon={<Layers className="h-5 w-5" />}
                iconColor="text-muted-foreground"
                iconBg="bg-muted"
                title="New Project"
                description="Organize your work"
              />
            </div>
          </CardContent>
        </Card>
      </ShowMore>
        </>
      )}
      </AppShell>
    </ProtectedRoute>
  )
}

function QuickActionCard({
  href,
  icon,
  iconColor,
  iconBg,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm"
    >
      <div className={`rounded-xl p-3 transition-colors group-hover:scale-105 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <span className="font-medium text-sm block">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </Link>
  )
}
