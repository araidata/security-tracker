"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  DocumentTextIcon,
  FlagIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: ChartBarIcon },
  { name: "Goals", href: "/goals", icon: FlagIcon },
  { name: "Rocks", href: "/rocks", icon: CubeIcon },
  { name: "Assignments", href: "/assignments", icon: ClipboardDocumentListIcon },
  { name: "Reviews", href: "/reviews/monthly", icon: ClipboardDocumentCheckIcon },
  { name: "Updates", href: "/updates", icon: DocumentTextIcon },
];

const reviewLinks = [
  { name: "Monthly", href: "/reviews/monthly", icon: CalendarDaysIcon },
  { name: "Quarterly", href: "/reviews/quarterly", icon: ClipboardDocumentCheckIcon },
];

const adminNavigation = [
  { name: "Users", href: "/admin/users", icon: UserGroupIcon },
  { name: "Audit Log", href: "/admin/audit-log", icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isExecutive = session?.user?.role === "EXECUTIVE";

  return (
    <aside className="fixed inset-y-4 left-4 z-40 hidden w-[17rem] lg:block">
      <div className="surface-outline flex h-full flex-col overflow-hidden px-4 py-4">
        <div className="rounded-[24px] border border-accent/20 bg-background/70 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
              <ShieldCheckIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Sentinel HQ</p>
              <p className="eyebrow mt-1">Executive Oversight</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-background-secondary/70 px-3 py-3">
            <p className="metric-label">Current Operator</p>
            <p className="mt-2 text-sm font-medium text-text-primary">
              {session?.user?.name || "Mission Control"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {session?.user?.role || "Executive"}
            </p>
          </div>
        </div>

        <nav className="mt-5 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                name={item.name}
                active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
              />
            ))}
          </div>

          <div className="mt-6">
            <p className="eyebrow px-3">Review Cadence</p>
            <div className="mt-2 space-y-1">
              {reviewLinks.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  name={item.name}
                  active={pathname.startsWith(item.href)}
                  compact
                />
              ))}
            </div>
          </div>

          {isExecutive && (
            <div className="mt-6">
              <p className="eyebrow px-3">Admin</p>
              <div className="mt-2 space-y-1">
                {adminNavigation.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    name={item.name}
                    active={pathname.startsWith(item.href)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="space-y-3 border-t border-border pt-4">
          <Link href="/updates" className="btn-primary w-full">
            New Briefing
          </Link>
          <button className="btn-secondary w-full justify-start">
            <LifebuoyIcon className="mr-2 h-4 w-4" />
            Help
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-secondary w-full justify-start"
          >
            <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  name,
  active,
  compact = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all duration-hover",
        compact ? "py-2.5" : "",
        active
          ? "border-accent/25 bg-accent/12 text-text-primary shadow-[0_0_0_1px_rgba(122,162,255,0.12)]"
          : "border-transparent text-text-secondary hover:border-border hover:bg-background-tertiary/65 hover:text-text-primary"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
          active
            ? "border-accent/30 bg-accent/14 text-accent"
            : "border-border bg-background-secondary/70 text-text-tertiary group-hover:text-text-primary"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="font-medium">{name}</span>
    </Link>
  );
}
