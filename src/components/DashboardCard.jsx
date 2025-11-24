export const DashboardCard = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-card rounded-lg shadow-lg p-6 border border-border ${className}`}>
      {title && <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>}
      {children}
    </div>
  )
}
