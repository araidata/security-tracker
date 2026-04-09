import { DEPARTMENT_CONFIG } from "@/lib/constants";

type Department = keyof typeof DEPARTMENT_CONFIG;

export function DepartmentBadge({ department }: { department: Department }) {
  const config = DEPARTMENT_CONFIG[department];
  return (
    <span className="inline-flex items-center rounded bg-background-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
      {config.label}
    </span>
  );
}
