"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { DEPARTMENT_CONFIG } from "@/lib/constants";
import { getDepartmentFromSlug } from "@/lib/schedule";
import { getFiscalYear, getInitials, getQuarterFromDate } from "@/lib/utils";
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const routeNames: Record<string, string> = {
  "/dashboard": "Mission Control",
  "/goals": "Annual Goals",
  "/rocks": "Quarterly Rocks",
  "/weekly": "Weekly",
  "/monthly": "Monthly",
  "/quarterly": "Quarterly",
  "/admin/users": "User Directory",
  "/admin/audit-log": "Audit Log",
};

function getPageTitle(pathname: string): string {
  const directMatch =
    Object.entries(routeNames).find(
      ([path]) => pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
    )?.[1];

  if (directMatch) return directMatch;

  if (pathname.startsWith("/teams/")) {
    const teamSlug = pathname.split("/")[2];
    const department = teamSlug ? getDepartmentFromSlug(teamSlug) : null;
    if (department) {
      return `${DEPARTMENT_CONFIG[department].label} Team Schedule`;
    }
  }

  return "Mission Control";
}

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const pageTitle = getPageTitle(pathname);
  const quarter = getQuarterFromDate();
  const year = getFiscalYear();

  return (
    <header className="sticky top-3 z-30">
      <div className="surface-outline flex h-[52px] items-center justify-between px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="truncate text-sm font-semibold text-text-primary">{pageTitle}</h2>
            <span className="hidden rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-text-secondary md:inline-flex">
              FY{year} {quarter}
            </span>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <div className="hidden min-w-[14rem] items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 lg:flex">
            <MagnifyingGlassIcon className="h-3.5 w-3.5 text-text-tertiary" />
            <span className="truncate text-xs text-text-tertiary">
              Search {pageTitle.toLowerCase()}...
            </span>
          </div>
          <IconButton icon={<BellIcon className="h-3.5 w-3.5" />} />
          <IconButton icon={<Cog6ToothIcon className="h-3.5 w-3.5" />} />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-secondary px-3"
          >
            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-[11px] font-semibold text-accent">
            {getInitials(session?.user?.name || "MC")}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-text-secondary transition-all duration-hover hover:border-border-strong hover:text-text-primary">
      {icon}
    </button>
  );
}
