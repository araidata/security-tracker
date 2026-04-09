import Link from "next/link";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { GoalStatusBadge } from "@/components/shared/status-badge";
import { goalService } from "@/lib/services/goal.service";
import { formatDate, formatPercent } from "@/lib/utils";

export default async function GoalsPage() {
  let goals: any[] = [];
  try {
    goals = await goalService.list({
      fiscalYear: new Date().getFullYear(),
    });
  } catch {
    // DB not connected
  }

  const totalGoals = goals.length;
  const onTrackGoals = goals.filter((goal) => goal.status === "ON_TRACK").length;
  const atRiskGoals = goals.filter((goal) => goal.status === "AT_RISK" || goal.status === "OFF_TRACK").length;
  const linkedRocks = goals.reduce((sum, goal) => sum + goal._count.rocks, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annual Goals"
        description="Fiscal-year strategic directives with ownership, completion, and linked quarterly execution."
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
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryPanel label="Security score" value={`${totalGoals > 0 ? Math.round((onTrackGoals / totalGoals) * 100) : 0}%`} detail={`${onTrackGoals} on track`} />
            <SummaryPanel label="Goals at risk" value={atRiskGoals} detail="Need leadership attention" tone="risk" />
            <SummaryPanel label="Linked rocks" value={linkedRocks} detail="Execution mapped to strategy" />
          </div>

          <div className="table-shell">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Strategic Directives</p>
                <h2 className="mt-2 text-2xl font-semibold text-text-primary">Annual objective registry</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
                <span className="rounded-full border border-border bg-background px-3 py-1.5">FY current</span>
                <span className="rounded-full border border-border bg-background px-3 py-1.5">{goals.length} total</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-5 py-4 text-left">Strategic Goal</th>
                    <th className="px-4 py-4 text-left">Department</th>
                    <th className="px-4 py-4 text-left">Owner</th>
                    <th className="px-4 py-4 text-left">Status</th>
                    <th className="px-4 py-4 text-left">Priority</th>
                    <th className="px-4 py-4 text-left">Completion</th>
                    <th className="px-4 py-4 text-left">Rocks</th>
                    <th className="px-5 py-4 text-left">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((goal) => (
                    <tr key={goal.id} className="table-row align-top">
                      <td className="px-5 py-5">
                        <Link
                          href={`/goals/${goal.id}`}
                          className="text-base font-semibold text-text-primary transition-colors hover:text-accent"
                        >
                          {goal.title}
                        </Link>
                        {goal.description && (
                          <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                            {goal.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-5">
                        <DepartmentBadge department={goal.department} />
                      </td>
                      <td className="px-4 py-5 text-sm text-text-secondary">
                        {goal.owner.name}
                      </td>
                      <td className="px-4 py-5">
                        <GoalStatusBadge status={goal.status} />
                      </td>
                      <td className="px-4 py-5">
                        <PriorityBadge priority={goal.priority} />
                      </td>
                      <td className="px-4 py-5">
                        <div className="w-36">
                          <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
                            <span>Completion</span>
                            <span>{formatPercent(goal.completionPct)}</span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-bar"
                              style={{ width: `${Math.min(goal.completionPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm font-medium text-text-primary">
                        {goal._count.rocks}
                      </td>
                      <td className="px-5 py-5 text-sm text-text-secondary">
                        {formatDate(goal.targetDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryPanel({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "risk";
}) {
  return (
    <div className="card-hover">
      <p className="metric-label">{label}</p>
      <p className={tone === "risk" ? "mt-3 text-4xl font-semibold text-status-off-track" : "mt-3 text-4xl font-semibold text-text-primary"}>
        {value}
      </p>
      <p className="mt-2 text-sm text-text-secondary">{detail}</p>
    </div>
  );
}
