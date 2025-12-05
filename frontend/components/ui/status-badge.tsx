"use client"

import { cn } from "@/lib/utils"
import { Loader2, CheckCircle2, XCircle, Clock, Pause } from "lucide-react"

type Status =
  | "pending"
  | "queued"
  | "running"
  | "training"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled"
  | "uploaded"
  | "profiling"
  | "profiled"
  | "error"

interface StatusBadgeProps {
  status: Status
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<Status, { label: string; icon: typeof Loader2; colorClass: string; animate?: boolean }> = {
  pending: { label: "Pending", icon: Clock, colorClass: "bg-muted text-muted-foreground" },
  queued: { label: "Queued", icon: Clock, colorClass: "bg-muted text-muted-foreground" },
  running: { label: "Running", icon: Loader2, colorClass: "bg-primary/10 text-primary", animate: true },
  training: { label: "Training", icon: Loader2, colorClass: "bg-primary/10 text-primary", animate: true },
  generating: { label: "Generating", icon: Loader2, colorClass: "bg-primary/10 text-primary", animate: true },
  profiling: { label: "Profiling", icon: Loader2, colorClass: "bg-primary/10 text-primary", animate: true },
  completed: { label: "Completed", icon: CheckCircle2, colorClass: "bg-success/10 text-success" },
  profiled: { label: "Profiled", icon: CheckCircle2, colorClass: "bg-success/10 text-success" },
  uploaded: { label: "Uploaded", icon: CheckCircle2, colorClass: "bg-success/10 text-success" },
  failed: { label: "Failed", icon: XCircle, colorClass: "bg-risk/10 text-risk" },
  error: { label: "Error", icon: XCircle, colorClass: "bg-risk/10 text-risk" },
  cancelled: { label: "Cancelled", icon: Pause, colorClass: "bg-muted text-muted-foreground" },
}

export function StatusBadge({ status, size = "md", showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
        config.colorClass,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "lg" && "text-base px-3 py-1.5",
        className,
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            config.animate && "animate-spin",
            size === "sm" && "h-3 w-3",
            size === "lg" && "h-4 w-4",
          )}
        />
      )}
      <span>{config.label}</span>
    </div>
  )
}
