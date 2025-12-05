"use client"

import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, FolderOpen, Database, Zap, FileBarChart, MoreVertical, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

// Mock data
const mockProjects = [
  {
    id: "p1",
    name: "Healthcare Analytics",
    description: "Patient records and clinical trial data synthesis",
    datasets: 5,
    generators: 3,
    evaluations: 12,
    created_at: "2024-11-15T10:00:00Z",
  },
  {
    id: "p2",
    name: "Financial Services",
    description: "Transaction data and customer profiles",
    datasets: 8,
    generators: 4,
    evaluations: 18,
    created_at: "2024-10-20T14:30:00Z",
  },
  {
    id: "p3",
    name: "Retail Analytics",
    description: "Customer behavior and sales data",
    datasets: 3,
    generators: 2,
    evaluations: 6,
    created_at: "2024-12-01T09:00:00Z",
  },
]

export default function ProjectsPage() {
  const { user } = useAuth()

  return (
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

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search projects..." className="pl-10" />
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <Card key={project.id} className="group hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      <Link href={`/projects/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">{project.description}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-risk">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  <span>{project.datasets}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{project.generators}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileBarChart className="h-3.5 w-3.5" />
                  <span>{project.evaluations}</span>
                </div>
              </div>

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
          <Card className="h-full min-h-[200px] border-dashed hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-center">
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
    </AppShell>
  )
}
