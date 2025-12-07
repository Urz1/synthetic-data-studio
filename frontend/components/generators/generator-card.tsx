"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EpsilonBadge } from "@/components/ui/epsilon-badge"
import { Zap, MoreHorizontal, Trash2, Eye, Download, FileBarChart } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Generator } from "@/lib/types"

interface GeneratorCardProps {
  generator: Generator
  onDelete?: () => void
  className?: string
}

export function GeneratorCard({ generator, onDelete, className }: GeneratorCardProps) {
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

  return (
    <Card className={cn("group transition-shadow hover:shadow-md", className)}>
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
            >
              <MoreHorizontal className="h-4 w-4" />
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
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download synthetic data
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-risk" onClick={onDelete}>
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
            <p className="font-mono font-medium">{generator.parameters_json.epochs}</p>
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
  )
}
