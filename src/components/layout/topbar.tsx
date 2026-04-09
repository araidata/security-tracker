"use client";

import { usePathname } from "next/navigation";
import { getQuarterFromDate, getFiscalYear } from "@/lib/utils";

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/goals": "Annual Goals",
  "/rocks": "Quarterly Rocks",
  "/assignments": "Assignments",
  "/updates": "Weekly Updates",
  "/reviews/monthly": "Monthly Reviews",
  "/reviews/quarterly": "Quarterly Reviews",
  "/admin/users": "User Management",
  "/admin/audit-log": "Audit Log",
};

export function Topbar() {
  const pathname = usePathname();

  const pageTitle =
    Object.entries(routeNames).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] || "Security Program Tracker";

  const quarter = getQuarterFromDate();
  const year = getFiscalYear();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-text-primary">{pageTitle}</h2>
      <div className="flex items-center gap-4">
        <span className="rounded-lg bg-background-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary">
          FY{year} {quarter}
        </span>
      </div>
    </header>
  );
}
