"use client"

import { useState } from "react"
import { Plus, FolderPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import type { Project } from "@/lib/types"

interface ProjectSelectorProps {
  projects: Project[]
  selectedProjectId: string
  onProjectChange: (projectId: string) => void
  onProjectCreated?: (project: Project) => void
  isLoading?: boolean
  disabled?: boolean
  label?: string
  placeholder?: string
  className?: string
}

/**
 * ProjectSelector - A dropdown that allows selecting an existing project
 * or creating a new one inline without leaving the current page.
 * 
 * Features:
 * - Lists all available projects
 * - "+ Create New Project" option at the bottom
 * - Inline modal for creating a new project
 * - Auto-selects the newly created project
 */
export function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectChange,
  onProjectCreated,
  isLoading = false,
  disabled = false,
  label = "Target Project",
  placeholder = "Select project",
  className,
}: ProjectSelectorProps) {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")

  // Handle value change - detect if it's the "create new" action
  const handleValueChange = (value: string) => {
    if (value === "__create_new__") {
      setIsModalOpen(true)
    } else {
      onProjectChange(value)
    }
  }

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a project name",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const newProject = await api.createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      })

      toast({
        title: "Project created",
        description: `"${newProject.name}" is ready to use`,
      })

      // Notify parent of new project
      if (onProjectCreated) {
        onProjectCreated(newProject)
      }

      // Auto-select the new project
      onProjectChange(newProject.id)

      // Reset and close
      setNewProjectName("")
      setNewProjectDescription("")
      setIsModalOpen(false)
    } catch (error) {
      console.error("Failed to create project:", error)
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Enter key in the modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCreateProject()
    }
  }

  return (
    <>
      <div className={className}>
        {label && (
          <Label htmlFor="project-selector" className="text-sm font-medium">
            {label}
          </Label>
        )}
        <Select
          value={selectedProjectId}
          onValueChange={handleValueChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger id="project-selector" className="mt-1.5">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent>
            {/* Existing projects */}
            {projects.length > 0 ? (
              projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No projects yet
              </div>
            )}
            
            {/* Separator */}
            {projects.length > 0 && (
              <div className="mx-1 my-1 border-t" />
            )}
            
            {/* Create new option */}
            <SelectItem
              value="__create_new__"
              className="text-primary font-medium"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Project
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Create New Project
            </DialogTitle>
            <DialogDescription>
              Create a project to organize your datasets and generators.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="e.g., Healthcare Analytics Q1"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isCreating}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="project-description"
                placeholder="Brief description of this project's purpose..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                disabled={isCreating}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !newProjectName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
