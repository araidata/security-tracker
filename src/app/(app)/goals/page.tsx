import { EmptyState } from "@/components/shared/empty-state";
import { GoalsWorkspace } from "@/components/goals/goals-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { goalService } from "@/lib/services/goal.service";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  let goals: any[] = [];
  try {
    goals = await goalService.list({
      fiscalYear: new Date().getFullYear(),
    });
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Annual Goals"
        description="Use grouped department rollups for leadership review, then switch to the condensed sheet when you need a fast meeting update view."
        createHref="/goals/new"
        createLabel="Create New Goal"
      />

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Create your first annual goal to start tracking strategic outcomes and linked execution."
          actionLabel="Create Goal"
          actionHref="/goals/new"
        />
      ) : (
        <GoalsWorkspace goals={goals} />
      )}
    </div>
  );
}
