"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EpsilonBadge } from "@/components/ui/epsilon-badge"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Zap, MoreHorizontal, Trash2, Eye, Download, FileBarChart, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import type { Generator } from "@/lib/types"

interface GeneratorCardProps {
  generator: Generator
  onDeleted?: (id: string) => void
  className?: string
}

export function GeneratorCard({ generator, onDeleted, className }: GeneratorCardProps) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-"
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  // Handle download synthetic data
  const handleDownload = async () => {
    if (!generator.output_dataset_id) {
      toast({
        title: "No data available",
        description: "This generator has not produced any synthetic data yet.",
        variant: "destructive",
      })
      return
    }

    setIsDownloading(true)
    toast({
      title: "Preparing download...",
      description: "Generating download link",
    })

    try {
      const result = await api.downloadDataset(generator.output_dataset_id)
      
      if (result.download_url) {
        // Trigger browser download
        const link = document.createElement('a')
        link.href = result.download_url
        link.download = result.filename || `${generator.name}_synthetic.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download complete",
          description: `${result.filename || 'Synthetic data'} saved`,
        })
      } else {
        toast({
          title: "Download unavailable",
          description: "Could not generate download link. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Download failed – please try again",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle delete generator
  const handleDelete = async () => {
    setIsDeleting(true)
    toast({
      title: `Deleting ${generator.name}...`,
      description: "Please wait while the generator is being removed.",
    })

    try {
      await api.deleteGenerator(generator.id)
      
      toast({
        title: "Generator deleted",
        description: `${generator.name} has been permanently removed.`,
      })
      
      onDeleted?.(generator.id)
    } catch (err) {
      toast({
        title: `Could not delete ${generator.name}`,
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <Card className={cn(
        "group transition-shadow hover:shadow-md",
        isDeleting && "opacity-50 pointer-events-none",
        className
      )}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "rounded-lg p-2 shrink-0",
                generator.privacy_config?.use_differential_privacy ? "bg-success/10" : "bg-primary/10",
              )}
            >
              <Zap
                className={cn(
                  "h-5 w-5",
                  generator.privacy_config?.use_differential_privacy ? "text-success" : "text-primary",
                )}
              />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate block" title={generator.name}>
                {generator.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate">{formatDate(generator.created_at)}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isDeleting || isDownloading}
              >
                {isDownloading || isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/generators/${generator.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </Link>
              </DropdownMenuItem>
              {generator.status === "completed" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/evaluations/new?generator=${generator.id}`}>
                      <FileBarChart className="mr-2 h-4 w-4" />
                      Run evaluation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDownload}
                    disabled={isDownloading || !generator.output_dataset_id}
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download synthetic data
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Model</p>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{generator.type}</code>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <StatusBadge status={generator.status} size="sm" showIcon={false} />
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Epochs</p>
              <p className="font-mono font-medium">{generator.parameters_json?.epochs ?? '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Duration</p>
              <p className="font-mono font-medium">{formatDuration(generator.training_metadata?.duration_seconds)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <EpsilonBadge
            epsilon={generator.privacy_spent?.epsilon ?? generator.privacy_config?.target_epsilon}
            delta={generator.privacy_spent?.delta ?? generator.privacy_config?.target_delta}
            size="sm"
          />
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        entityType="Generator"
        entityName={generator.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  )
}
