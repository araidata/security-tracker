import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-4 lg:px-5">
      <Sidebar />
      <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col lg:pl-[18.5rem]">
        <Topbar />
        <main className="flex-1 pt-5">
          <div className="surface-outline min-h-[calc(100vh-8rem)] px-5 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-[1500px]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
