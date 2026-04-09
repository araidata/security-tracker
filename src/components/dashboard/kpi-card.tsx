import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/solid";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  accentColor,
}: KPICardProps) {
  return (
    <div className="card-hover h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="metric-label">{title}</p>
          <p
            className={cn(
              "mt-3 text-4xl font-semibold tracking-tight text-text-primary",
              accentColor
            )}
          >
            {value}
          </p>
          {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-text-secondary">
            {icon}
          </div>
        )}
      </div>
      {trend && trendLabel && (
        <div className="mt-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em]">
          {trend === "up" && <ArrowUpIcon className="h-3.5 w-3.5 text-status-on-track" />}
          {trend === "down" && <ArrowDownIcon className="h-3.5 w-3.5 text-status-off-track" />}
          <span
            className={cn(
              trend === "up" && "text-status-on-track",
              trend === "down" && "text-status-off-track",
              trend === "neutral" && "text-text-tertiary"
            )}
          >
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
