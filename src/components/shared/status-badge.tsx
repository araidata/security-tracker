import { cn } from "@/lib/utils";
import { STATUS_CONFIG, ROCK_STATUS_CONFIG, TASK_STATUS_CONFIG } from "@/lib/constants";

type GoalStatus = keyof typeof STATUS_CONFIG;
type RockStatus = keyof typeof ROCK_STATUS_CONFIG;
type TaskStatus = keyof typeof TASK_STATUS_CONFIG;

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.bg,
        config.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function RockStatusBadge({ status }: { status: RockStatus }) {
  const config = ROCK_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.bg,
        config.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = TASK_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.bg,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
