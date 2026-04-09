import Link from "next/link";
import { notFound } from "next/navigation";
import { goalService } from "@/lib/services/goal.service";
import { PageHeader } from "@/components/shared/page-header";
import { GoalStatusBadge, RockStatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { formatPercent, formatDate } from "@/lib/utils";
import { PencilIcon } from "@heroicons/react/24/outline";

export default async function GoalDetailPage({
  params,
}: {
  params: { goalId: string };
}) {
  let goal;
  try {
    goal = await goalService.getById(params.goalId);
  } catch {
    notFound();
  }
  if (!goal) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={goal.title}>
        <Link href={`/goals/${goal.id}/edit`} className="btn-secondary">
          <PencilIcon className="mr-1.5 h-4 w-4" />
          Edit
        </Link>
      </PageHeader>

      {/* Goal Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Description
          </h3>
          <p className="text-sm text-text-primary leading-relaxed">
            {goal.description}
          </p>
          {goal.metrics && (
            <>
              <h3 className="mb-2 mt-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Success Metrics
              </h3>
              <p className="text-sm text-text-primary leading-relaxed">
                {goal.metrics}
              </p>
            </>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Status</span>
            <GoalStatusBadge status={goal.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Priority</span>
            <PriorityBadge priority={goal.priority} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Department</span>
            <DepartmentBadge department={goal.department} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Owner</span>
            <span className="text-sm text-text-primary">{goal.owner.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Target Date</span>
            <span className="text-sm text-text-primary">
              {formatDate(goal.targetDate)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">FY</span>
            <span className="text-sm text-text-primary">{goal.fiscalYear}</span>
          </div>
          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Completion</span>
              <span className="text-sm font-semibold text-text-primary">
                {formatPercent(goal.completionPct)}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-background-tertiary">
              <div
                className="h-2.5 rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(goal.completionPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Linked Rocks */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Linked Rocks ({goal.rocks.length})
          </h3>
          <Link href={`/rocks/new?goalId=${goal.id}`} className="btn-primary text-xs">
            Add Rock
          </Link>
        </div>

        {goal.rocks.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-tertiary">
            No rocks linked to this goal yet.
          </p>
        ) : (
          <div className="space-y-3">
            {goal.rocks.map((rock) => (
              <Link
                key={rock.id}
                href={`/rocks/${rock.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-background-tertiary"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {rock.title}
                  </p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {rock.quarter} &middot; {rock.owner.name}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-3">
                  <ConfidenceIndicator confidence={rock.confidence} />
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 rounded-full bg-background-tertiary">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{
                          width: `${Math.min(rock.completionPct, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary">
                      {formatPercent(rock.completionPct)}
                    </span>
                  </div>
                  <RockStatusBadge status={rock.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
