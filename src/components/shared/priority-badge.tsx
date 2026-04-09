import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/lib/constants";

type Priority = keyof typeof PRIORITY_CONFIG;

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", config.bg, config.color)}>
      {config.label}
    </span>
  );
}
