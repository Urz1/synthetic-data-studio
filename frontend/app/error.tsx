'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error)
    }
  }, [error])

  // Check if this is an HMR-related error
  const isHMRError = error.message.includes('module factory') || 
                     error.message.includes('HMR') ||
                     error.message.includes('was instantiated')

  const handleRefresh = () => {
    // For HMR errors, do a full page reload to clear module cache
    if (isHMRError) {
      window.location.reload()
    } else {
      reset()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            {isHMRError 
              ? "Development server encountered a hot reload issue. Refreshing will fix this."
              : "An error occurred while rendering this page."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleRefresh} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              {isHMRError ? 'Refresh Page' : 'Try Again'}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
