import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-store";
import { Topbar } from "@/components/layout/topbar";

export const metadata: Metadata = {
  title: "SOF Compass",
  description: "Internal member operations dashboard.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen px-2 py-2">
        <Sidebar />
        <AppShell>
          <Topbar />
          <main className="flex-1 pt-2">
            <div className="surface-outline min-h-[calc(100vh-5.5rem)] px-3 py-3">
              <div className="mx-auto max-w-[1500px]">{children}</div>
            </div>
          </main>
        </AppShell>
      </div>
    </SidebarProvider>
  );
}
