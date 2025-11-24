"use client"

import { AlertCircle, RotateCcw } from "lucide-react"

export const ErrorAlert = ({ message, onRetry }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-background p-4">
      <div className="bg-card border border-destructive/20 rounded-lg p-8 max-w-md w-full shadow-lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground text-sm mb-4">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
