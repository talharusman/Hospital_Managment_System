export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="inline-flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary"></div>
        </div>
        <p className="mt-4 text-muted-foreground font-medium">Loading...</p>
      </div>
    </div>
  )
}
