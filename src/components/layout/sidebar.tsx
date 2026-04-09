"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  ShieldCheckIcon,
  ChartBarIcon,
  FlagIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: ChartBarIcon },
  { name: "Annual Goals", href: "/goals", icon: FlagIcon },
  { name: "Quarterly Rocks", href: "/rocks", icon: CubeIcon },
  { name: "Assignments", href: "/assignments", icon: ClipboardDocumentListIcon },
  { name: "Weekly Updates", href: "/updates", icon: DocumentTextIcon },
  {
    name: "Reviews",
    children: [
      { name: "Monthly", href: "/reviews/monthly", icon: CalendarDaysIcon },
      { name: "Quarterly", href: "/reviews/quarterly", icon: ClipboardDocumentCheckIcon },
    ],
  },
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background-secondary">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <ShieldCheckIcon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-text-primary">Security Tracker</h1>
          <p className="text-xs text-text-tertiary">Program Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            if ("children" in item) {
              return (
                <div key={item.name} className="pt-3">
                  <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    {item.name}
                  </p>
                  {item.children!.map((child) => (
                    <NavItem
                      key={child.href}
                      href={child.href}
                      icon={child.icon}
                      name={child.name}
                      active={pathname.startsWith(child.href)}
                    />
                  ))}
                </div>
              );
            }
            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                name={item.name}
                active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
              />
            );
          })}

          {isExecutive && (
            <div className="pt-3">
              <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Admin
              </p>
              {adminNavigation.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  name={item.name}
                  active={pathname.startsWith(item.href)}
                />
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
            {session?.user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">
              {session?.user?.name || "User"}
            </p>
            <p className="truncate text-xs text-text-tertiary">
              {session?.user?.role || ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-background-tertiary hover:text-text-primary"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
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
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-hover",
        active
          ? "bg-accent/10 text-accent font-medium"
          : "text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {name}
    </Link>
  );
}
