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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="metric-label">{title}</p>
          <p
            className={cn(
              "mt-1.5 text-2xl font-semibold tracking-tight text-text-primary",
              accentColor
            )}
          >
            {value}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-text-secondary">
            {icon}
          </div>
        )}
      </div>
      {trend && trendLabel && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em]">
          {trend === "up" && <ArrowUpIcon className="h-3 w-3 text-status-on-track" />}
          {trend === "down" && <ArrowDownIcon className="h-3 w-3 text-status-off-track" />}
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
