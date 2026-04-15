"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-store";
import {
  ChartBarIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  FlagIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: ChartBarIcon },
  { name: "Goals", href: "/goals", icon: FlagIcon },
  { name: "Rocks", href: "/rocks", icon: CubeIcon },
  { name: "Assignments", href: "/assignments", icon: ClipboardDocumentListIcon },
  { name: "Reviews", href: "/reviews/monthly", icon: ClipboardDocumentCheckIcon },
  { name: "Updates", href: "/updates", icon: DocumentTextIcon },
];

const adminNavigation = [
  { name: "Users", href: "/admin/users", icon: UserGroupIcon },
  { name: "Audit Log", href: "/admin/audit-log", icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed, toggle } = useSidebar();
  const isExecutive = session?.user?.role === "EXECUTIVE";

  return (
    <aside
      className={cn(
        "fixed inset-y-3 left-3 z-40 hidden lg:block transition-all duration-300",
        collapsed ? "w-[3.5rem]" : "w-[16rem]"
      )}
    >
      <div className="surface-outline flex h-full flex-col overflow-hidden py-3">
        {/* Brand */}
        <div
          className={cn(
            "mx-2 rounded-[18px] border border-accent/20 bg-background/70",
            collapsed ? "px-1.5 py-2 flex items-center justify-center" : "px-3 py-2.5"
          )}
        >
          {collapsed ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <ShieldCheckIcon className="h-4 w-4 text-accent" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
                <ShieldCheckIcon className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">SOF Compass</p>
                <p className="eyebrow mt-0.5">Executive Oversight</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="mt-3 flex-1 overflow-y-auto px-2">
          <div className="space-y-0.5">
            {navigation.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                name={item.name}
                active={
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                }
                collapsed={collapsed}
              />
            ))}
          </div>

          {isExecutive && (
            <div className="mt-4">
              {!collapsed && (
                <p className="eyebrow px-2 mb-1">Admin</p>
              )}
              <div className="space-y-0.5">
                {adminNavigation.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    name={item.name}
                    active={pathname.startsWith(item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-2 pt-2 border-t border-border space-y-1">
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-xs font-medium text-text-tertiary transition-all hover:border-border hover:bg-background-tertiary/65 hover:text-text-primary",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronDoubleLeftIcon className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* New Briefing */}
          <Link
            href="/updates"
            className={cn(
              "btn-primary w-full",
              collapsed && "px-0 justify-center"
            )}
          >
            {collapsed ? (
              <PlusIcon className="h-4 w-4" />
            ) : (
              <>
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                New Briefing
              </>
            )}
          </Link>
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
  collapsed,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? name : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border px-2 py-1.5 text-sm transition-all duration-hover",
        collapsed && "justify-center px-2",
        active
          ? "border-accent/25 bg-accent/12 text-text-primary shadow-[0_0_0_1px_rgba(122,162,255,0.12)]"
          : "border-transparent text-text-secondary hover:border-border hover:bg-background-tertiary/65 hover:text-text-primary"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
          active
            ? "border-accent/30 bg-accent/14 text-accent"
            : "border-border bg-background-secondary/70 text-text-tertiary group-hover:text-text-primary"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      {!collapsed && <span className="font-medium">{name}</span>}
    </Link>
  );
}
