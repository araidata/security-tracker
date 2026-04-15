import { WeeklyWorkspace } from "@/components/weekly/weekly-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { rockService } from "@/lib/services/rock.service";
import { updateService } from "@/lib/services/update.service";

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  let rocks: any[] = [];
  let recentUpdates: any[] = [];

  try {
    [rocks, recentUpdates] = await Promise.all([
      rockService.list({ fiscalYear: new Date().getFullYear() }),
      updateService.listRecent(300),
    ]);
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-2">
      <PageHeader
        title="Weekly"
        createHref="/rocks/new"
        createLabel="New Rock"
      />
      <WeeklyWorkspace rocks={rocks} recentUpdates={recentUpdates} />
    </div>
  );
}
