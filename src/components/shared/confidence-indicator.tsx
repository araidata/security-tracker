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
    <span className={cn("inline-flex items-center gap-1 text-xs", config.color)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
