import Link from "next/link";
import { goalService } from "@/lib/services/goal.service";
import { PageHeader } from "@/components/shared/page-header";
import { GoalStatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPercent, formatDate } from "@/lib/utils";

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
    <div>
      <PageHeader
        title="Annual Goals"
        description="Strategic goals for the current fiscal year"
        createHref="/goals/new"
        createLabel="New Goal"
      />

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Create your first annual goal to get started"
          actionLabel="Create Goal"
          actionHref="/goals/new"
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Goal</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Completion</th>
                <th className="px-4 py-3 text-left">Rocks</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.id} className="table-row">
                  <td className="px-4 py-3">
                    <Link
                      href={`/goals/${goal.id}`}
                      className="text-sm font-medium text-text-primary hover:text-accent"
                    >
                      {goal.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <DepartmentBadge department={goal.department} />
                  </td>
                  <td className="px-4 py-3">
                    <GoalStatusBadge status={goal.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={goal.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-background-tertiary">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${Math.min(goal.completionPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">
                        {formatPercent(goal.completionPct)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {goal._count.rocks}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {goal.owner.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary">
                    {formatDate(goal.targetDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
