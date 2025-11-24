import { cn } from "../../lib/utils"

export const PageContainer = ({ title, description, actions, children, className, contentClassName }) => (
  <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        {title && <h1 className="text-3xl font-semibold text-foreground">{title}</h1>}
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>

    <div className={cn("grid gap-6", className)}>
      <div className={cn("rounded-3xl border border-border/60 bg-card/85 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70", contentClassName)}>
        {children}
      </div>
    </div>
  </section>
)

export default PageContainer
