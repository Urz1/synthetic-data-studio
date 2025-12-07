"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GeneratorCard } from "@/components/generators/generator-card"
import { Plus, Search, Filter, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import type { Generator } from "@/lib/types"

export default function GeneratorsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [modelFilter, setModelFilter] = React.useState<string>("all")
  const [generators, setGenerators] = React.useState<Generator[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { user } = useAuth()

  React.useEffect(() => {
    loadGenerators()
  }, [])

  async function loadGenerators() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.listGenerators()
      setGenerators(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load generators")
    } finally {
      setLoading(false)
    }
  }

  const filteredGenerators = generators.filter((gen) => {
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
            placeholder="Search generators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search generators"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]" aria-label="Filter by status">
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
            <SelectTrigger className="w-[130px]" aria-label="Filter by model type">
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
      </>
      )}
    </AppShell>
  )
}
