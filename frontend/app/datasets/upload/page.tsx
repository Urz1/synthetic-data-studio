"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Project } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"

export default function DatasetUploadPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // State
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProject, setSelectedProject] = React.useState<string>("")
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  // New project creation state
  const [showNewProjectInput, setShowNewProjectInput] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState("")
  const [creatingProject, setCreatingProject] = React.useState(false)

  // Load projects
  React.useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await api.listProjects()
      setProjects(data)
      if (data.length > 0) {
        setSelectedProject(data[0].id)
      }
    } catch (err) {
      console.error("Failed to load projects:", err)
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return
    
    setCreatingProject(true)
    setError(null)
    
    try {
      const newProject = await api.createProject({ 
        name: newProjectName.trim(),
        description: ""
      })
      // Add to projects list and select it
      setProjects(prev => [...prev, newProject])
      setSelectedProject(newProject.id)
      setShowNewProjectInput(false)
      setNewProjectName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setCreatingProject(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.json')) {
      setError("Only CSV and JSON files are supported")
      return
    }

    // Validate file size (50MB max - optimized for CTGAN training)
    const maxSize = 50 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError("File size must be less than 50MB")
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!file) {
      setError("Please select a file")
      return
    }

    if (!selectedProject) {
      setError("Please select a project")
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload dataset
      const dataset = await api.uploadDataset(file, selectedProject)
      
      clearInterval(progressInterval)
      setProgress(100)
      setSuccess(true)

      // Navigate to dataset details after short delay
      setTimeout(() => {
        router.push(`/datasets/${dataset.id}`)
      }, 1500)

    } catch (err) {
      console.error("Upload failed:", err)
      setError(err instanceof Error ? err.message : "Failed to upload dataset")
    } finally {
      setUploading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Upload Dataset"
          description="Upload a CSV or JSON file to create a new dataset"
        />

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Upload</CardTitle>
              <CardDescription>
                Supported formats: CSV, JSON (max 50MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={selectedProject} onValueChange={(value) => {
                    if (value === "create-new") {
                      setShowNewProjectInput(true)
                      setSelectedProject("")
                    } else {
                      setShowNewProjectInput(false)
                      setSelectedProject(value)
                    }
                  }}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="create-new" className="text-primary font-medium">
                        + Create New Project
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Inline new project creation */}
                  {showNewProjectInput && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="New project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        disabled={creatingProject}
                      />
                      <Button 
                        type="button" 
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim() || creatingProject}
                        size="sm"
                      >
                        {creatingProject ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Create"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewProjectInput(false)
                          setNewProjectName("")
                          if (projects.length > 0) {
                            setSelectedProject(projects[0].id)
                          }
                        }}
                        disabled={creatingProject}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {file && (
                      <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Progress */}
                {uploading && (
                  <div className="space-y-2" role="status" aria-live="polite" aria-busy="true">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span aria-label={`Upload progress ${progress}%`}>{progress}%</span>
                    </div>
                    <Progress value={progress} aria-label={`Upload progress ${progress}%`} />
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <Alert className="border-green-500 bg-green-50" role="status" aria-live="polite">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Dataset uploaded successfully! Redirecting...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive" role="alert" aria-live="assertive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!file || !selectedProject || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Dataset
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• CSV files should have headers in the first row</p>
              <p>• JSON files should be an array of objects</p>
              <p>• Maximum file size: 50MB</p>
              <p>• Data will be automatically profiled after upload</p>
              <p>• PII detection will run in the background</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
