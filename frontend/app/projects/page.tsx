"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, FolderOpen, Database, Zap, FileBarChart, MoreVertical, Calendar, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { useDeleteWithProgress } from "@/hooks/use-delete-with-progress"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useProjects, useDeleteProject } from "@/lib/hooks"
import type { Project } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"

export default function ProjectsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // TanStack Query for data fetching with caching
  const { data: projectsData, isLoading: loading, error: queryError, refetch } = useProjects()
  const projects = useMemo(() => {
    if (!projectsData) return []
    return Array.isArray(projectsData) ? projectsData : []
  }, [projectsData])
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load projects") : null

  // Optimistic delete mutation - removes item from UI instantly
  const deleteProjectMutation = useDeleteProject()

  // Delete hook with progress tracking (uses the optimistic mutation)
  const { isDeleting, isGhostId, startDelete } = useDeleteWithProgress({
    entityType: "Project",
    onSuccess: () => {
      setProjectToDelete(null)
    },
    onError: () => {
      setProjectToDelete(null)
    },
  })

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return
    
    await startDelete(
      projectToDelete.id,
      projectToDelete.name,
      () => deleteProjectMutation.mutateAsync(projectToDelete.id)
    )
  }

  return (
    <ProtectedRoute>
    <AppShell user={user || { full_name: "", email: "" }}>
      <PageHeader
        title="Projects"
        description="Organize your datasets, generators, and evaluations"
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card className="mb-6 bg-card/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Find projects</CardTitle>
          <CardDescription>Search by name or description.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search projects"
            />
          </div>
        </CardContent>
      </Card>

      <p className="sr-only" aria-live="polite">
        Showing {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"} matching search.
      </p>

      {loading ? (
        <ProjectsSkeleton />
      ) : (
        filteredProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group bg-card/40 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base line-clamp-1" title={project.name}>
                          <Link href={`/projects/${project.id}`} className="hover:underline">
                            {project.name}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5 line-clamp-2" title={project.description || "No description"}>
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
                          aria-label={`Project actions for ${project.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          Edit (Coming Soon)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setProjectToDelete(project)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${project.id}`}>Open</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Create new project card */}
            <Link href="/projects/new">
              <Card className="h-full min-h-[200px] border-dashed bg-card/40 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-center">
                <div className="text-center">
                  <div className="rounded-full bg-muted p-3 mx-auto mb-3 w-fit">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">Create New Project</p>
                  <p className="text-xs text-muted-foreground mt-1">Start organizing your work</p>
                </div>
              </Card>
            </Link>
          </div>
        ) : (
          <Card className="border-dashed bg-card/40" role="status" aria-live="polite">
            <CardContent className="py-12">
              <div className="mx-auto max-w-md text-center space-y-4">
                <div className="mx-auto w-fit rounded-2xl bg-primary/10 p-3">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{searchQuery ? "No projects match your search" : "No projects yet"}</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Try a different keyword." : "Create a project to group datasets, generators, and evaluations."}
                  </p>
                </div>
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first project
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        entityType="Project"
        entityName={projectToDelete?.name}
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </AppShell>
    </ProtectedRoute>
  )
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="bg-card/40">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pt-3 border-t">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
