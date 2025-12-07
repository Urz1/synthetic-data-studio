'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Check if this is an HMR error
    const isHMRError = error.message.includes('module factory') || 
                       error.message.includes('HMR') ||
                       error.message.includes('was instantiated')
    
    if (isHMRError && typeof window !== 'undefined') {
      console.warn('HMR error detected, attempting recovery...')
      // Auto-refresh on HMR errors in development
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    } else {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
