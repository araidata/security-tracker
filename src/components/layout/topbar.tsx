"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
  "/assignments": "Assignments",
  "/updates": "Weekly Updates",
  "/reviews/monthly": "Monthly Reviews",
  "/reviews/quarterly": "Quarterly Reviews",
  "/admin/users": "User Directory",
  "/admin/audit-log": "Audit Log",
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const pageTitle =
    Object.entries(routeNames).find(([path]) => pathname.startsWith(path))?.[1] || "Mission Control";

  const quarter = getQuarterFromDate();
  const year = getFiscalYear();

  return (
    <header className="sticky top-4 z-30">
      <div className="surface-outline flex h-[76px] items-center justify-between px-4 sm:px-5">
        <div className="min-w-0">
          <p className="eyebrow">SOF Compass</p>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="truncate text-lg font-semibold text-text-primary">{pageTitle}</h2>
            <span className="hidden rounded-full border border-border bg-background px-3 py-1 text-xs text-text-secondary md:inline-flex">
              FY{year} {quarter}
            </span>
          </div>
        </div>

        <div className="ml-5 flex items-center gap-3">
          <div className="hidden min-w-[18rem] items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 lg:flex">
            <MagnifyingGlassIcon className="h-4 w-4 text-text-tertiary" />
            <span className="truncate text-sm text-text-tertiary">
              Search {pageTitle.toLowerCase()}...
            </span>
          </div>
          <IconButton icon={<BellIcon className="h-4 w-4" />} />
          <IconButton icon={<Cog6ToothIcon className="h-4 w-4" />} />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-secondary px-3 sm:px-4"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-xs font-semibold text-accent">
            {getInitials(session?.user?.name || "Mission Control")}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-text-secondary transition-all duration-hover hover:border-border-strong hover:text-text-primary">
      {icon}
    </button>
  );
}
