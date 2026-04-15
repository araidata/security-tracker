import { QuarterlyContent } from "@/components/quarterly/quarterly-content";
import { PageHeader } from "@/components/shared/page-header";
import { goalService } from "@/lib/services/goal.service";
import { rockService } from "@/lib/services/rock.service";
import { reviewService } from "@/lib/services/review.service";

export const dynamic = "force-dynamic";

export default async function QuarterlyPage() {
  const year = new Date().getFullYear();
  let goals: any[] = [];
  let rocks: any[] = [];
  let reviews: any[] = [];

  try {
    [goals, rocks, reviews] = await Promise.all([
      goalService.list({ fiscalYear: year }),
      rockService.list({ fiscalYear: year }),
      reviewService.listQuarterly({ fiscalYear: year }),
    ]);
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-2">
      <PageHeader title="Quarterly" />
      <QuarterlyContent goals={goals} rocks={rocks} reviews={reviews} />
    </div>
  );
}
