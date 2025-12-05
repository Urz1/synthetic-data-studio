"use client"

import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Database, Zap, FileBarChart, Shield, Download, AlertTriangle, Clock, Loader2 } from "lucide-react"

type ActivityType =
  | "dataset_uploaded"
  | "generator_started"
  | "generator_completed"
  | "generator_failed"
  | "evaluation_started"
  | "evaluation_completed"
  | "export_ready"
  | "pii_detected"

interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
  maxItems?: number
}

const activityConfig: Record<
  ActivityType,
  {
    icon: typeof Database
    iconColor: string
    bgColor: string
  }
> = {
  dataset_uploaded: {
    icon: Database,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  generator_started: {
    icon: Loader2,
    iconColor: "text-warning-foreground",
    bgColor: "bg-warning/10",
  },
  generator_completed: {
    icon: Zap,
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
  generator_failed: {
    icon: AlertTriangle,
    iconColor: "text-risk",
    bgColor: "bg-risk/10",
  },
  evaluation_started: {
    icon: Clock,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  evaluation_completed: {
    icon: FileBarChart,
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
  export_ready: {
    icon: Download,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  pii_detected: {
    icon: Shield,
    iconColor: "text-warning-foreground",
    bgColor: "bg-warning/10",
  },
}

export function ActivityFeed({ activities, className, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  return (
    <div className={cn("space-y-1", className)}>
      {displayedActivities.map((activity, index) => {
        const config = activityConfig[activity.type]
        const Icon = config.icon
        const isLast = index === displayedActivities.length - 1

        return (
          <div key={activity.id} className="flex gap-3 py-3 group">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shrink-0", config.bgColor)}>
                <Icon
                  className={cn("h-4 w-4", config.iconColor, activity.type === "generator_started" && "animate-spin")}
                />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm font-medium leading-tight">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
              )}
              <p className="text-xs text-muted-foreground/70 mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
