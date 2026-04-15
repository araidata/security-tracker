import { MonthlyWorkspace } from "@/components/monthly/monthly-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { rockService } from "@/lib/services/rock.service";
import { updateService } from "@/lib/services/update.service";
import { reviewService } from "@/lib/services/review.service";

export const dynamic = "force-dynamic";

export default async function MonthlyPage() {
  let rocks: any[] = [];
  let recentUpdates: any[] = [];
  let reviews: any[] = [];

  try {
    const year = new Date().getFullYear();
    [rocks, recentUpdates, reviews] = await Promise.all([
      rockService.list({ fiscalYear: year }),
      updateService.listRecent(300),
      reviewService.listMonthly({ fiscalYear: year }),
    ]);
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-2">
      <PageHeader title="Monthly" />
      <MonthlyWorkspace rocks={rocks} recentUpdates={recentUpdates} reviews={reviews} />
    </div>
  );
}
