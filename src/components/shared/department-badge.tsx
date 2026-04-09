import { DEPARTMENT_CONFIG } from "@/lib/constants";

type Department = keyof typeof DEPARTMENT_CONFIG;

export function DepartmentBadge({ department }: { department: Department }) {
  const config = DEPARTMENT_CONFIG[department];
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
      {config.label}
    </span>
  );
}
