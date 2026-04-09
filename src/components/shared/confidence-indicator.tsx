import { cn } from "@/lib/utils";
import { CONFIDENCE_CONFIG } from "@/lib/constants";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Confidence = keyof typeof CONFIDENCE_CONFIG;

const iconMap = {
  HIGH: CheckCircleIcon,
  MEDIUM: ExclamationTriangleIcon,
  LOW: XCircleIcon,
};

export function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const config = CONFIDENCE_CONFIG[confidence];
  const Icon = iconMap[confidence];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        config.color
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
