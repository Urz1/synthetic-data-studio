"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GeneratorCard } from "@/components/generators/generator-card"
import { Plus, Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Generator } from "@/lib/types"

// Mock data
const mockGenerators: Generator[] = [
  {
    id: "1",
    dataset_id: "d1",
    name: "Patient Records Generator",
    type: "dp-ctgan",
    status: "completed",
    parameters_json: { epochs: 300, batch_size: 500 },
    privacy_config: { use_differential_privacy: true, target_epsilon: 10.0, target_delta: 1e-5 },
    privacy_spent: { epsilon: 8.7, delta: 9.8e-6 },
    training_metadata: { duration_seconds: 342, final_loss: 0.023 },
    created_by: "user1",
    created_at: "2024-12-10T10:00:00Z",
    updated_at: "2024-12-10T12:00:00Z",
  },
  {
    id: "2",
    dataset_id: "d2",
    name: "Financial Transactions",
    type: "ctgan",
    status: "training",
    parameters_json: { epochs: 500, batch_size: 256 },
    created_by: "user1",
    created_at: "2024-12-14T08:00:00Z",
    updated_at: "2024-12-14T08:30:00Z",
  },
  {
    id: "3",
    dataset_id: "d3",
    name: "Customer Demographics",
    type: "dp-tvae",
    status: "completed",
    parameters_json: { epochs: 200, batch_size: 128 },
    privacy_config: { use_differential_privacy: true, target_epsilon: 5.0, target_delta: 1e-6 },
    privacy_spent: { epsilon: 4.8, delta: 9.5e-7 },
    training_metadata: { duration_seconds: 180, final_loss: 0.018 },
    created_by: "user1",
    created_at: "2024-12-12T14:00:00Z",
    updated_at: "2024-12-12T15:30:00Z",
  },
  {
    id: "4",
    dataset_id: "d1",
    name: "Time Series Test",
    type: "timegan",
    status: "failed",
    parameters_json: { epochs: 100, batch_size: 64 },
    created_by: "user1",
    created_at: "2024-12-13T09:00:00Z",
    updated_at: "2024-12-13T09:30:00Z",
  },
]

export default function GeneratorsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [modelFilter, setModelFilter] = React.useState<string>("all")
  const { user } = useAuth()

  const filteredGenerators = mockGenerators.filter((gen) => {
    const matchesSearch = gen.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || gen.status === statusFilter
    const matchesModel = modelFilter === "all" || gen.type === modelFilter
    return matchesSearch && matchesStatus && matchesModel
  })

  return (
    <AppShell user={user || { full_name: "", email: "" }}>
      <PageHeader
        title="Generators"
        description="Manage your synthetic data generators"
        actions={
          <Button asChild>
            <Link href="/generators/new">
              <Plus className="mr-2 h-4 w-4" />
              New Generator
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search generators..."
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
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="ctgan">CTGAN</SelectItem>
              <SelectItem value="tvae">TVAE</SelectItem>
              <SelectItem value="dp-ctgan">DP-CTGAN</SelectItem>
              <SelectItem value="dp-tvae">DP-TVAE</SelectItem>
              <SelectItem value="timegan">TimeGAN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generators Grid */}
      {filteredGenerators.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGenerators.map((generator) => (
            <GeneratorCard key={generator.id} generator={generator} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== "all" || modelFilter !== "all"
              ? "No generators match your filters"
              : "No generators created yet"}
          </p>
          {!search && statusFilter === "all" && modelFilter === "all" && (
            <Button asChild>
              <Link href="/generators/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first generator
              </Link>
            </Button>
          )}
        </div>
      )}
    </AppShell>
  )
}
