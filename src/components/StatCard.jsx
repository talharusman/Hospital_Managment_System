"use client"

import { cn } from "../../lib/utils"

const gradientMap = {
  primary: "from-[var(--primary)] via-[color-mix(in srgb,var(--primary) 80%, transparent 20%)] to-[color-mix(in srgb,var(--primary) 70%, var(--background) 30%)]",
  blue: "from-[var(--stat-blue-start)] via-[var(--stat-blue-mid)] to-[var(--stat-blue-end)]",
  teal: "from-[var(--stat-teal-start)] via-[var(--stat-teal-mid)] to-[var(--stat-teal-end)]",
  purple: "from-[var(--stat-purple-start)] via-[var(--stat-purple-mid)] to-[var(--stat-purple-end)]",
  orange: "from-[var(--stat-orange-start)] via-[var(--stat-orange-mid)] to-[var(--stat-orange-end)]",
  green: "from-[var(--stat-green-start)] via-[var(--stat-green-mid)] to-[var(--stat-green-end)]",
  yellow: "from-[var(--stat-yellow-start)] via-[var(--stat-yellow-mid)] to-[var(--stat-yellow-end)]",
  red: "from-[var(--stat-red-start)] via-[var(--stat-red-mid)] to-[var(--stat-red-end)]",
}

const badgeTones = {
  blue: {
    background: "var(--stat-blue-mid)",
    color: "var(--primary-foreground)",
  },
  teal: {
    background: "var(--stat-teal-mid)",
    color: "var(--primary-foreground)",
  },
  purple: {
    background: "var(--stat-purple-mid)",
    color: "var(--primary-foreground)",
  },
  orange: {
    background: "var(--stat-orange-mid)",
    color: "var(--primary-foreground)",
  },
  green: {
    background: "var(--stat-green-mid)",
    color: "var(--primary-foreground)",
  },
  yellow: {
    background: "var(--stat-yellow-mid)",
    color: "var(--primary-foreground)",
  },
  red: {
    background: "var(--stat-red-mid)",
    color: "var(--primary-foreground)",
  },
  primary: {
    background: "var(--primary)",
    color: "var(--primary-foreground)",
  },
}

const trendColor = {
  up: "var(--trend-up)",
  down: "var(--trend-down)",
  neutral: "var(--trend-neutral)",
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  trend,
  trendLabel,
  footer,
  className,
}) => {
  const gradient = gradientMap[color] || (typeof color === "string" && color.includes("from-") ? color : gradientMap.primary)
  const trendTone = trendColor[trend] || trendColor.neutral
  const badgeTone = badgeTones[color] || badgeTones.primary

  return (
    <article className={cn("relative overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm", className)}>
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-card/10 via-card/5 to-transparent" />
      <div className={cn("absolute -right-16 -top-16 h-40 w-40 rounded-full bg-linear-to-br opacity-25", gradient)} />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {title && <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground/80">{title}</p>}
          <p className="text-3xl font-semibold text-foreground">{value}</p>
        </div>
        {Icon && (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: badgeTone.background, color: badgeTone.color }}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {(trend || trendLabel) && (
        <p className="mt-4 text-sm font-medium" style={{ color: trendTone }}>
          {trendLabel || trend}
        </p>
      )}

      {footer && <div className="mt-4 text-xs text-muted-foreground/80">{footer}</div>}
    </article>
  )
}

export default StatCard