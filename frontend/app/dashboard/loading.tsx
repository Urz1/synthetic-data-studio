"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Database, Zap, FileBarChart, Layers } from "lucide-react"

/**
 * Dashboard Loading Skeleton
 * Matches the actual dashboard layout for seamless transition.
 * This is shown instantly while data loads.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton - hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-card p-4">
        {/* Logo area */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        
        {/* Nav items */}
        <div className="space-y-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 h-10 px-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        
        {/* Bottom user section */}
        <div className="mt-auto pt-4 border-t">
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        {/* Top navbar skeleton - mobile */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          {/* Contextual tip skeleton */}
          <div className="bg-muted/30 border rounded-lg p-4">
            <div className="flex gap-3">
              <Skeleton className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
          
          {/* Metric cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Database, label: "Datasets" },
              { icon: Zap, label: "Generators" },
              { icon: FileBarChart, label: "Evaluations" },
              { icon: Layers, label: "Projects" },
            ].map((item, i) => (
              <Card key={i} className="bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Main content grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left column - Generators table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Right column - Activity feed */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-2 w-2 rounded-full mt-2" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
