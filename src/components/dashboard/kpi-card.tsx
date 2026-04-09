import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

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
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className={cn("mt-2 text-3xl font-semibold", accentColor || "text-text-primary")}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-background-tertiary p-2.5">
            {icon}
          </div>
        )}
      </div>
      {trend && trendLabel && (
        <div className="mt-3 flex items-center gap-1">
          {trend === "up" && (
            <ArrowUpIcon className="h-3.5 w-3.5 text-status-on-track" />
          )}
          {trend === "down" && (
            <ArrowDownIcon className="h-3.5 w-3.5 text-status-off-track" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
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
