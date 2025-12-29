"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GeneratorCard } from "@/components/generators/generator-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Filter, Zap, RefreshCw, Code } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGenerators } from "@/lib/hooks"
import type { Generator } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"

export default function GeneratorsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [modelFilter, setModelFilter] = React.useState<string>("all")
  const { user } = useAuth()

  // TanStack Query for data fetching with caching
  const { data: generatorsData, isLoading: loading, error: queryError, refetch } = useGenerators()
  const generators = React.useMemo(() => {
    if (!generatorsData) return []
    return Array.isArray(generatorsData) ? generatorsData : []
  }, [generatorsData])
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load generators") : null

  const filteredGenerators = generators.filter((gen) => {
    const matchesSearch = gen.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || gen.status === statusFilter
    const matchesModel = modelFilter === "all" || gen.type === modelFilter
    return matchesSearch && matchesStatus && matchesModel
  })

  return (
    <ProtectedRoute>
    <AppShell user={user || { full_name: "", email: "" }}>
      <PageHeader
        title="Generators"
        description="Manage your synthetic data generators"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/generators/schema">
                <Code className="mr-2 h-4 w-4" />
                Schema Generator
              </Link>
            </Button>
            <Button asChild>
              <Link href="/generators/new">
                <Plus className="mr-2 h-4 w-4" />
                New Generator
              </Link>
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span className="break-words">{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <GeneratorsSkeleton />
      ) : (
        <>
          {/* Filters */}
          <Card className="mb-6 bg-card/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Find generators</CardTitle>
              <CardDescription>Search by name and refine by status and model type.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]" aria-label="Filter by status">
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
                    <SelectTrigger className="w-[160px]" aria-label="Filter by model type">
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
            </CardContent>
          </Card>

      {/* Generators Grid */}
      {filteredGenerators.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGenerators.map((generator) => (
            <GeneratorCard 
              key={generator.id} 
              generator={generator}
              onDeleted={() => {
                // TanStack Query will refetch the list automatically
                refetch()
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed bg-card/40">
          <CardContent className="py-12">
            <div className="mx-auto max-w-md text-center space-y-4">
              <div className="mx-auto w-fit rounded-2xl bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">
                  {search || statusFilter !== "all" || modelFilter !== "all"
                    ? "No generators match your filters"
                    : "No generators yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== "all" || modelFilter !== "all"
                    ? "Try changing the status or model filter."
                    : "Create a generator to train a synthetic model from a dataset."}
                </p>
              </div>
              {!search && statusFilter === "all" && modelFilter === "all" && (
                <Button asChild>
                  <Link href="/generators/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first generator
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </AppShell>
    </ProtectedRoute>
  )
}

function GeneratorsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-card/40">
        <CardHeader className="pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full max-w-sm" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Skeleton className="h-7 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
