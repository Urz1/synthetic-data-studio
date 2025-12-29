"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Database, Download, MoreHorizontal, Trash2, Eye, AlertTriangle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Dataset } from "@/lib/types"

interface DatasetCardProps {
  dataset: Dataset
  onDelete?: () => void
  onDownload?: () => void
  className?: string
}

export function DatasetCard({ dataset, onDelete, onDownload, className }: DatasetCardProps) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = React.useState(false)
  const hasPii = dataset.pii_flags && Object.keys(dataset.pii_flags).length > 0
  const piiCount = hasPii ? Object.keys(dataset.pii_flags!).length : 0

  const handleDownload = async () => {
    if (isDownloading) return
    
    setIsDownloading(true)
    toast({
      title: "Preparing download...",
      description: `Getting ${dataset.name} ready`,
    })
    
    try {
      const result = await api.downloadDataset(dataset.id)
      if (result.download_url) {
        window.open(result.download_url, "_blank")
        toast({
          title: "Download Started",
          description: "Your file is being downloaded",
        })
      }
      if (onDownload) onDownload()
    } catch (err) {
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : "Failed to download dataset",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return "-"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className={cn("group transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base truncate block" title={dataset.name}>
              {dataset.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate">{formatDate(dataset.uploaded_at)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Dataset options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/datasets/${dataset.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
              <Download className={`mr-2 h-4 w-4 ${isDownloading ? 'animate-pulse' : ''}`} />
              {isDownloading ? 'Downloading...' : 'Download'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Rows</p>
            <p className="font-mono font-medium">{dataset.row_count?.toLocaleString() || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Columns</p>
            <p className="font-mono font-medium">{dataset.column_count || Object.keys(dataset.schema_data || {}).length || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Size</p>
            <p className="font-mono font-medium">{formatSize(dataset.size_bytes)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Status</p>
            <StatusBadge status={dataset.status} size="sm" showIcon={false} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        {hasPii && (
          <div className="flex items-center gap-2 text-xs text-warning-foreground bg-warning/10 rounded-md px-2.5 py-1.5 w-full">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {piiCount} PII column{piiCount !== 1 ? "s" : ""} detected
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
