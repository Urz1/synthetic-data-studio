"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EvaluationCard } from "@/components/evaluations/evaluation-card"
import { Plus, Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Evaluation } from "@/lib/types"

// Mock data
const mockEvaluations: Evaluation[] = [
  {
    id: "e1",
    generator_id: "g1",
    dataset_id: "d1",
    status: "completed",
    report: {
      statistical_similarity: {
        overall_score: 0.92,
        column_scores: {},
        correlation_difference: 0.03,
      },
      ml_utility: {
        train_on_synthetic_test_on_real: { accuracy: 0.84, f1: 0.82 },
        train_on_real_test_on_real: { accuracy: 0.87, f1: 0.85 },
        utility_preservation: 0.96,
      },
      privacy: {
        membership_inference_auc: 0.52,
        attribute_inference_accuracy: 0.48,
        nearest_neighbor_distance: { min: 2.3, mean: 15.7, std: 8.2 },
        privacy_risk: "low",
      },
      overall_quality_score: 0.89,
      recommendations: ["High quality synthetic data suitable for analytics"],
    },
    created_at: "2024-12-14T10:00:00Z",
  },
  {
    id: "e2",
    generator_id: "g2",
    dataset_id: "d2",
    status: "completed",
    report: {
      statistical_similarity: {
        overall_score: 0.78,
        column_scores: {},
        correlation_difference: 0.08,
      },
      ml_utility: {
        train_on_synthetic_test_on_real: { accuracy: 0.72, f1: 0.7 },
        train_on_real_test_on_real: { accuracy: 0.87, f1: 0.85 },
        utility_preservation: 0.82,
      },
      privacy: {
        membership_inference_auc: 0.58,
        attribute_inference_accuracy: 0.55,
        nearest_neighbor_distance: { min: 1.8, mean: 12.3, std: 6.1 },
        privacy_risk: "medium",
      },
      overall_quality_score: 0.72,
      recommendations: ["Consider increasing training epochs"],
    },
    created_at: "2024-12-13T14:00:00Z",
  },
  {
    id: "e3",
    generator_id: "g3",
    dataset_id: "d3",
    status: "running",
    created_at: "2024-12-15T09:00:00Z",
  },
]

const mockGeneratorNames: Record<string, string> = {
  g1: "Patient Records Generator",
  g2: "Financial Transactions",
  g3: "Customer Demographics",
}

export default function EvaluationsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const { user } = useAuth()

  const filteredEvaluations = mockEvaluations.filter((evaluation) => {
    const generatorName = mockGeneratorNames[evaluation.generator_id] || ""
    const matchesSearch = generatorName.toLowerCase().includes(search.toLowerCase())
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
              generatorName={mockGeneratorNames[evaluation.generator_id]}
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
    </AppShell>
  )
}
