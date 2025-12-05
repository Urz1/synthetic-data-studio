"use client"

import type * as React from "react"
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
import { Plus, Database, Zap, FileBarChart, ArrowRight, Layers, Eye, Download, Play, BarChart3, Activity } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { Generator } from "@/lib/types"

// Mock data with more realistic values
const mockStats = {
  totalDatasets: 12,
  datasetsGrowth: 8,
  activeGenerators: 3,
  completedEvaluations: 28,
  evaluationsGrowth: 15,
  avgPrivacyScore: 0.87,
  privacyTrend: [0.72, 0.75, 0.78, 0.82, 0.85, 0.87],
}

const mockRecentGenerators: Generator[] = [
  {
    id: "gen-1",
    dataset_id: "ds-1",
    name: "Patient Records Generator",
    type: "dp-ctgan",
    status: "completed",
    parameters_json: { epochs: 300, batch_size: 500 },
    privacy_config: { use_differential_privacy: true, target_epsilon: 8.5, target_delta: 1e-5 },
    privacy_spent: { epsilon: 8.2, delta: 9.5e-6 },
    training_metadata: { duration_seconds: 1842, final_loss: 0.023 },
    created_by: "user1",
    created_at: "2024-12-14T10:30:00Z",
    updated_at: "2024-12-14T12:45:00Z",
  },
  {
    id: "gen-2",
    dataset_id: "ds-2",
    name: "Financial Transactions",
    type: "ctgan",
    status: "training",
    parameters_json: { epochs: 500, batch_size: 256 },
    created_by: "user1",
    created_at: "2024-12-15T08:00:00Z",
    updated_at: "2024-12-15T08:30:00Z",
  },
  {
    id: "gen-3",
    dataset_id: "ds-3",
    name: "Customer Demographics",
    type: "dp-tvae",
    status: "pending",
    parameters_json: { epochs: 200, batch_size: 128 },
    privacy_config: { use_differential_privacy: true, target_epsilon: 5.0, target_delta: 1e-6 },
    created_by: "user1",
    created_at: "2024-12-15T09:00:00Z",
    updated_at: "2024-12-15T09:00:00Z",
  },
]

const mockActivities = [
  {
    id: "act-1",
    type: "generator_completed" as const,
    title: "Generator completed",
    description: "Patient Records Generator finished training with ε=8.2",
    timestamp: "2024-12-15T12:45:00Z",
  },
  {
    id: "act-2",
    type: "evaluation_completed" as const,
    title: "Evaluation completed",
    description: "Quality score: 92% | Privacy risk: Low",
    timestamp: "2024-12-15T11:30:00Z",
  },
  {
    id: "act-3",
    type: "pii_detected" as const,
    title: "PII detected in dataset",
    description: "Found 4 columns with potential PII in customers.csv",
    timestamp: "2024-12-15T10:15:00Z",
  },
  {
    id: "act-4",
    type: "dataset_uploaded" as const,
    title: "Dataset uploaded",
    description: "transactions_q4.csv (2.4 MB, 50,000 rows)",
    timestamp: "2024-12-15T09:00:00Z",
  },
  {
    id: "act-5",
    type: "export_ready" as const,
    title: "Privacy report ready",
    description: "PDF report for Patient Records Generator",
    timestamp: "2024-12-14T16:00:00Z",
  },
]

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
        <strong>Pro tip:</strong> Your most important metrics are shown above. Click "Show Activity Feed" below to see your full audit trail and quick actions.
      </ContextualTip>

      {/* Stats Grid - Always visible (20% that delivers 80% value) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 stagger-children">
        <MetricCard
          title="Total Datasets"
          value={mockStats.totalDatasets}
          trend={{ value: mockStats.datasetsGrowth, direction: "up", label: "from last month" }}
          icon={<Database className="h-5 w-5" />}
          quality="neutral"
        />
        <MetricCard
          title="Active Generators"
          value={mockStats.activeGenerators}
          subtitle="Currently training"
          icon={<Zap className="h-5 w-5" />}
          quality="neutral"
        />
        <MetricCard
          title="Evaluations"
          value={mockStats.completedEvaluations}
          trend={{ value: mockStats.evaluationsGrowth, direction: "up", label: "this month" }}
          icon={<FileBarChart className="h-5 w-5" />}
          quality="good"
        />
        <MetricCard
          title="Avg Privacy Score"
          value={`${(mockStats.avgPrivacyScore * 100).toFixed(0)}%`}
          tooltip="Average privacy score across all evaluations"
          sparkline={mockStats.privacyTrend}
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
            data={mockRecentGenerators.slice(0, 3)}
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
              <ActivityFeed activities={mockActivities} maxItems={5} />
            </CardContent>
          </Card>

          {/* Generator Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Generator Actions</CardTitle>
              <CardDescription>Quick actions for recent generators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockRecentGenerators.slice(0, 3).map((gen) => (
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
              ))}
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
