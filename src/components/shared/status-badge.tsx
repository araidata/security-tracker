import { cn } from "@/lib/utils";
import { STATUS_CONFIG, ROCK_STATUS_CONFIG, TASK_STATUS_CONFIG } from "@/lib/constants";

type GoalStatus = keyof typeof STATUS_CONFIG;
type RockStatus = keyof typeof ROCK_STATUS_CONFIG;
type TaskStatus = keyof typeof TASK_STATUS_CONFIG;

export function GoalStatusBadge({
  status,
  compact = false,
}: {
  status: GoalStatus;
  compact?: boolean;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        compact
          ? "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
          : "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.bg,
        config.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function RockStatusBadge({
  status,
  compact = false,
}: {
  status: RockStatus;
  compact?: boolean;
}) {
  const config = ROCK_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        compact
          ? "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
          : "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.bg,
        config.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function TaskStatusBadge({
  status,
  compact = false,
}: {
  status: TaskStatus;
  compact?: boolean;
}) {
  const config = TASK_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        compact
          ? "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
          : "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.bg,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
