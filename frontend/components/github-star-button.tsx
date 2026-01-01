"use client"

import { useEffect, useState } from "react"
import { Github, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface GitHubStarButtonProps {
  className?: string
}

export function GitHubStarButton({ className }: GitHubStarButtonProps) {
  const [stars, setStars] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Abort controller to cleanup fetch on unmount
    const controller = new AbortController()

    // Fetch star count from GitHub API
    fetch("https://api.github.com/repos/Urz1/synthetic-data-studio", {
      signal: controller.signal,
      next: { revalidate: 3600 } // Cache for 1 hour if possible in Next (client side this is ignored but good practice)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed")
        return res.json()
      })
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count)
        }
      })
      .catch((err) => {
        // Silent fail for stars, user can still click link
        if (err.name !== 'AbortError') {
          console.warn("Could not fetch stars (likely rate limit or network):", err)
        }
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  // Format number (e.g. 1.2k)
  const formatStars = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k"
    }
    return count.toString()
  }

  return (
    <a
      href="https://github.com/Urz1/synthetic-data-studio"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/50 hover:bg-muted/50",
        className
      )}
    >
      <Github className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Star</span>
      <div className={cn("flex items-center gap-1 border-l border-border pl-2 ml-1 text-muted-foreground group-hover:text-foreground", loading && "opacity-50")}>
        <Star className={cn("h-3 w-3", stars !== null && "fill-yellow-400 text-yellow-400")} />
        <span>{loading ? "-" : stars !== null ? formatStars(stars) : "Star"}</span>
      </div>
    </a>
  )
}
