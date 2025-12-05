"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, AlertCircle, CheckCircle2 } from "lucide-react"

interface DatasetUploadProps {
  projectId: string
  onUploadComplete?: (datasetId: string) => void
  className?: string
}

type UploadState = "idle" | "dragging" | "uploading" | "processing" | "complete" | "error"

export function DatasetUpload({ projectId, onUploadComplete, className }: DatasetUploadProps) {
  const [state, setState] = React.useState<UploadState>("idle")
  const [file, setFile] = React.useState<File | null>(null)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (state === "idle") {
      setState("dragging")
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (state === "dragging") {
      setState("idle")
    }
  }

  const validateFile = (file: File): string | null => {
    const validTypes = ["text/csv", "application/json", "application/vnd.ms-excel"]
    const validExtensions = [".csv", ".json"]

    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
    if (!validExtensions.includes(extension) && !validTypes.includes(file.type)) {
      return "Only CSV and JSON files are supported"
    }

    if (file.size > 100 * 1024 * 1024) {
      return "File size must be less than 100MB"
    }

    return null
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setState("idle")

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return

    const validationError = validateFile(droppedFile)
    if (validationError) {
      setError(validationError)
      setState("error")
      return
    }

    setFile(droppedFile)
    setError(null)
    uploadFile(droppedFile)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setState("error")
      return
    }

    setFile(selectedFile)
    setError(null)
    uploadFile(selectedFile)
  }

  const uploadFile = async (file: File) => {
    setState("uploading")
    setProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    // Simulate API call
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setState("processing")

      // Simulate processing
      setTimeout(() => {
        setState("complete")
        onUploadComplete?.("mock-dataset-id")
      }, 1500)
    }, 2000)
  }

  const reset = () => {
    setState("idle")
    setFile(null)
    setProgress(0)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upload Dataset</CardTitle>
        <CardDescription>Upload a CSV or JSON file to create synthetic data from</CardDescription>
      </CardHeader>
      <CardContent>
        {state === "idle" || state === "dragging" || state === "error" ? (
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
              state === "dragging"
                ? "border-primary bg-primary/5"
                : state === "error"
                  ? "border-risk/50 bg-risk/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {state === "error" ? (
              <>
                <AlertCircle className="h-10 w-10 text-risk mb-4" />
                <p className="text-sm font-medium text-risk mb-1">{error}</p>
                <Button variant="outline" size="sm" onClick={reset} className="mt-2 bg-transparent">
                  Try again
                </Button>
              </>
            ) : (
              <>
                <Upload
                  className={cn(
                    "h-10 w-10 mb-4 transition-colors",
                    state === "dragging" ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <p className="text-sm font-medium mb-1">
                  {state === "dragging" ? "Drop your file here" : "Drag and drop your file here"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Supports: CSV, JSON</span>
                  <span>Max size: 100MB</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-lg bg-muted p-2">
                <File className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file?.name}</p>
                <p className="text-xs text-muted-foreground">{file && formatFileSize(file.size)}</p>
              </div>
              {state !== "complete" && (
                <Button variant="ghost" size="icon" onClick={reset} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
              {state === "complete" && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
            </div>

            {/* Progress */}
            {(state === "uploading" || state === "processing") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {state === "uploading" ? "Uploading..." : "Processing..."}
                  </span>
                  <span className="font-mono text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Success state */}
            {state === "complete" && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-success">Upload complete!</p>
                <Button variant="outline" size="sm" onClick={reset}>
                  Upload another
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
