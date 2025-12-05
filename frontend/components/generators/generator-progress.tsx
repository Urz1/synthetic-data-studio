"use client"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/ui/status-badge"
import { Clock, Zap, Database, CheckCircle2 } from "lucide-react"
import type { GeneratorStatus } from "@/lib/types"

interface GeneratorProgressProps {
  status: GeneratorStatus
  name: string
  progress?: number
  metadata?: {
    duration_seconds?: number
    current_epoch?: number
    total_epochs?: number
    final_loss?: number
  }
  className?: string
}

const stages = [
  { key: "pending", label: "Queued", icon: Clock },
  { key: "training", label: "Training", icon: Zap },
  { key: "generating", label: "Generating", icon: Database },
  { key: "completed", label: "Complete", icon: CheckCircle2 },
]

function getStageIndex(status: GeneratorStatus): number {
  if (status === "failed") return -1
  const index = stages.findIndex((s) => s.key === status)
  return index >= 0 ? index : 0
}

export function GeneratorProgress({ status, name, progress, metadata, className }: GeneratorProgressProps) {
  const currentStageIndex = getStageIndex(status)
  const isFailed = status === "failed"

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-"
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  return (
    <Card className={cn(isFailed && "border-risk/30", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>Generator training progress</CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stage Indicators */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => {
              const isComplete = index < currentStageIndex
              const isCurrent = index === currentStageIndex && !isFailed
              const Icon = stage.icon

              return (
                <div
                  key={stage.key}
                  className={cn(
                    "flex flex-col items-center gap-2 z-10",
                    index === 0 && "items-start",
                    index === stages.length - 1 && "items-end",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      isComplete && "bg-success border-success text-success-foreground",
                      isCurrent && "bg-primary border-primary text-primary-foreground animate-pulse-subtle",
                      !isComplete && !isCurrent && "bg-muted border-border text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn("text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                    {stage.label}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Progress Line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-border -z-0">
            <div
              className="h-full bg-success transition-all duration-500"
              style={{
                width: `${Math.max(0, (currentStageIndex / (stages.length - 1)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Training Progress */}
        {(status === "training" || status === "generating") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {status === "training"
                  ? `Epoch ${metadata?.current_epoch || 0} of ${metadata?.total_epochs || 0}`
                  : "Generating synthetic data..."}
              </span>
              <span className="font-mono text-muted-foreground">{progress || 0}%</span>
            </div>
            <Progress value={progress || 0} className="h-2" />
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="font-mono text-sm">{formatDuration(metadata?.duration_seconds)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Epochs</p>
            <p className="font-mono text-sm">
              {metadata?.current_epoch || 0} / {metadata?.total_epochs || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Loss</p>
            <p className="font-mono text-sm">{metadata?.final_loss?.toFixed(4) || "-"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
