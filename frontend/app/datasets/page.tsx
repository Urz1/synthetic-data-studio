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
import { DatasetCard } from "@/components/datasets/dataset-card";
import { DatasetListRow } from "@/components/datasets/dataset-list-row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Filter,
  Database,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useDeleteWithProgress } from "@/hooks/use-delete-with-progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDatasets, useDeleteDataset } from "@/lib/hooks";
import { api } from "@/lib/api";
import type { Dataset } from "@/lib/types";
import ProtectedRoute from "@/components/layout/protected-route";
import { cn } from "@/lib/utils";

export default function DatasetsPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("created_at");
  const [sortOrder, setSortOrder] = React.useState<string>("desc");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [datasetToDelete, setDatasetToDelete] = React.useState<Dataset | null>(
    null
  );
  const { user } = useAuth();

  // TanStack Query for data fetching with caching
  const {
    data: datasetsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useDatasets(0, 100, sortBy, sortOrder); // Fetch up to 100 items, sorted by backend
  const datasets = React.useMemo(() => {
    if (!datasetsData) return [];
    return Array.isArray(datasetsData)
      ? datasetsData
      : datasetsData.datasets || [];
  }, [datasetsData]);

  // Client-side filtering, pagination and delete handlers
  const filteredDatasets = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return datasets.filter((d) => {
      const name = (d as any).name || "";
      const status = ((d as any).status || "").toLowerCase();
      const matchesSearch = !q || name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [datasets, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDatasets.length / itemsPerPage));
  const paginatedDatasets = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDatasets.slice(start, start + itemsPerPage);
  }, [filteredDatasets, currentPage, itemsPerPage]);

  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteClick = (dataset: Dataset) => {
    setDatasetToDelete(dataset);
  };

  const handleConfirmDelete = async () => {
    if (!datasetToDelete) return;
    try {
      setIsDeleting(true);
      // Call delete via ApiClient if available, otherwise fall back to request or fetch
      if ((api as any).delete) {
        await (api as any).delete(`/datasets/${datasetToDelete.id}`);
      } else if ((api as any).request) {
        await (api as any).request({ method: "DELETE", url: `/datasets/${datasetToDelete.id}` });
      } else {
        await fetch(`/datasets/${datasetToDelete.id}`, { method: "DELETE" });
      }
      setDatasetToDelete(null);
      refetch?.();
    } catch (err) {
      console.error("Failed to delete dataset", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isGhostId = (id: any) => typeof id === "string" && id.startsWith("ghost-");

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy, sortOrder]);

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        {/* ... */}
        
            {/* Filters */}
            <Card className="mb-6 bg-card/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Find datasets</CardTitle>
                <CardDescription>
                  Search by name and filter by status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search datasets..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      aria-label="Search datasets"
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
                        aria-label="Filter by dataset status"
                      >
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="uploaded">Uploaded</SelectItem>
                        <SelectItem value="profiling">Profiling</SelectItem>
                        <SelectItem value="profiled">Profiled</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
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
                        aria-label="Sort datasets"
                      >
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Newest First</SelectItem>
                        <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="row_count-desc">Most Rows</SelectItem>
                        <SelectItem value="row_count-asc">Fewest Rows</SelectItem>
                        <SelectItem value="size_bytes-desc">Largest Size</SelectItem>
                        <SelectItem value="size_bytes-asc">Smallest Size</SelectItem>
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

            {/* Datasets View */}
            {filteredDatasets.length > 0 ? (
              <>
                {/* Result count */}
                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <span>
                    Showing {paginatedDatasets.length} of{" "}
                    {filteredDatasets.length} datasets
                  </span>
                  {totalPages > 1 && (
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                  )}
                </div>

                {viewMode === "grid" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedDatasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className={cn(
                          isGhostId(dataset.id) && "deleting-ghost"
                        )}
                      >
                        <DatasetCard
                          dataset={dataset}
                          onDelete={() => handleDeleteClick(dataset)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Name
                            </th>
                            <th className="hidden sm:table-cell py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Rows
                            </th>
                            <th className="hidden sm:table-cell py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Columns
                            </th>
                            <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Size
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Status
                            </th>
                            <th className="hidden lg:table-cell py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              PII
                            </th>
                            <th className="py-3 px-4 w-12 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDatasets.map((dataset) => (
                            <DatasetListRow
                              key={dataset.id}
                              dataset={dataset}
                              onDelete={() => handleDeleteClick(dataset)}
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
                      <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {search || statusFilter !== "all"
                          ? "No datasets match your filters"
                          : "No datasets yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search || statusFilter !== "all"
                          ? "Try a different keyword or clear the status filter."
                          : "Upload a dataset to start profiling and training generators."}
                      </p>
                    </div>
                    {!search && statusFilter === "all" && (
                      <Button asChild>
                        <Link href="/datasets/upload">
                          <Plus className="mr-2 h-4 w-4" />
                          Upload your first dataset
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          entityType="Dataset"
          entityName={datasetToDelete?.name}
          open={!!datasetToDelete}
          onOpenChange={(open) => !open && setDatasetToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      </AppShell>
    </ProtectedRoute>
  );
}

function DatasetsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-card/40">
        <CardHeader className="pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-40" />
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
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
