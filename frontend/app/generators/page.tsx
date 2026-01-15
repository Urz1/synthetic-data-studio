"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
import { GeneratorCard } from "@/components/generators/generator-card";
import { GeneratorListRow } from "@/components/generators/generator-list-row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Filter,
  Zap,
  RefreshCw,
  Code,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGenerators } from "@/lib/hooks";
import type { Generator } from "@/lib/types";
import ProtectedRoute from "@/components/layout/protected-route";

export default function GeneratorsPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [modelFilter, setModelFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("created_at");
  const [sortOrder, setSortOrder] = React.useState<string>("desc");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();

  // TanStack Query for data fetching with caching
  const {
    data: generatorsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useGenerators(0, 100, sortBy, sortOrder); // Fetch up to 100 items, sorted by backend
  const generators = React.useMemo(() => {
    if (!generatorsData) return [];
    return Array.isArray(generatorsData) ? generatorsData : [];
  }, [generatorsData]);

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load generators"
    : null;

  const filteredGenerators = generators.filter((gen) => {
    const matchesSearch = gen.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || gen.status === statusFilter;
    const matchesModel = modelFilter === "all" || gen.type === modelFilter;
    return matchesSearch && matchesStatus && matchesModel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredGenerators.length / itemsPerPage);
  const paginatedGenerators = filteredGenerators.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, modelFilter, sortBy, sortOrder]);

  // Selection
  const [selectedGenerators, setSelectedGenerators] = React.useState<string[]>(
    []
  );

  // Reset selection when filters change
  React.useEffect(() => {
    setSelectedGenerators([]);
  }, [search, statusFilter, modelFilter, currentPage, sortBy, sortOrder]);

  const toggleSelection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedGenerators((prev) => [...prev, id]);
    } else {
      setSelectedGenerators((prev) => prev.filter((g) => g !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = paginatedGenerators.map((g) => g.id);
      setSelectedGenerators(ids);
    } else {
      setSelectedGenerators([]);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Generators"
          description="Manage your synthetic data generators"
          actions={
            <div className="flex gap-2">
              {selectedGenerators.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // Logic to bulk delete would go here
                    setSelectedGenerators([]);
                    refetch();
                  }}
                >
                  Delete Combined ({selectedGenerators.length})
                </Button>
              )}
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
                <CardDescription>
                  Search by name and refine by status and model type.
                </CardDescription>
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
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger
                        className="w-[140px]"
                        aria-label="Filter by status"
                      >
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
                      <SelectTrigger
                        className="w-[140px]"
                        aria-label="Filter by model type"
                      >
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

                    {/* Sort Dropdown */}
                    <Select
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [newSortBy, newSortOrder] = value.split("-");
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder);
                      }}
                    >
                      <SelectTrigger
                        className="w-[180px]"
                        aria-label="Sort generators"
                      >
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">
                          Newest First
                        </SelectItem>
                        <SelectItem value="created_at-asc">
                          Oldest First
                        </SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                        <SelectItem value="type-asc">Type (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* View Toggle */}
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-9 px-2.5 rounded-r-none"
                        onClick={() => setViewMode("grid")}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-9 px-2.5 rounded-l-none border-l"
                        onClick={() => setViewMode("list")}
                        aria-label="List view"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generators View */}
            {filteredGenerators.length > 0 ? (
              <>
                {/* Result count */}
                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <span>
                    Showing {paginatedGenerators.length} of{" "}
                    {filteredGenerators.length} generators
                  </span>
                  {totalPages > 1 && (
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                  )}
                </div>

                {viewMode === "grid" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedGenerators.map((generator) => (
                      <GeneratorCard
                        key={generator.id}
                        generator={generator}
                        onDeleted={() => refetch()}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="px-5 py-3 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Name
                            </th>
                            <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                              Model Type
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Status
                            </th>
                            <th className="hidden lg:table-cell py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Privacy
                            </th>
                            <th className="py-3 px-4 w-12 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedGenerators.map((generator) => (
                            <GeneratorListRow
                              key={generator.id}
                              generator={generator}
                              onDelete={() => refetch()}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5) {
                            if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2)
                              pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              className="w-9"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-dashed bg-card/40">
                <CardContent className="py-12">
                  <div className="mx-auto max-w-md text-center space-y-4">
                    <div className="mx-auto w-fit rounded-2xl bg-primary/10 p-3">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {search ||
                        statusFilter !== "all" ||
                        modelFilter !== "all"
                          ? "No generators match your filters"
                          : "No generators yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search ||
                        statusFilter !== "all" ||
                        modelFilter !== "all"
                          ? "Try changing the status or model filter."
                          : "Create a generator to train a synthetic model from a dataset."}
                      </p>
                    </div>
                    {!search &&
                      statusFilter === "all" &&
                      modelFilter === "all" && (
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
  );
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
  );
}
