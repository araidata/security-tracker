"use client";

import { useSidebar } from "./sidebar-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col transition-all duration-300 ${
        collapsed ? "lg:pl-[5rem]" : "lg:pl-[17.5rem]"
      }`}
    >
      {children}
    </div>
  );
}
