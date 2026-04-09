import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/lib/constants";

type Priority = keyof typeof PRIORITY_CONFIG;

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.bg,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
