import { EmptyState } from "@/components/shared/empty-state";
import { RocksWorkspace } from "@/components/rocks/rocks-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { rockService } from "@/lib/services/rock.service";

export const dynamic = "force-dynamic";

export default async function RocksPage() {
  let rocks: any[] = [];
  try {
    rocks = await rockService.list({
      fiscalYear: new Date().getFullYear(),
    });
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarterly Rocks"
        description="Run by department during meetings, then flip to the condensed sheet when you need the fastest possible update workflow."
        createHref="/rocks/new"
        createLabel="Create New Rock"
      />

      {rocks.length === 0 ? (
        <EmptyState
          title="No rocks yet"
          description="Create your first quarterly rock to start tracking execution against annual goals."
          actionLabel="Create Rock"
          actionHref="/rocks/new"
        />
      ) : (
        <RocksWorkspace rocks={rocks} />
      )}
    </div>
  );
}
