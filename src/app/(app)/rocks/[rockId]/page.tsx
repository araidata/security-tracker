import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rockService } from "@/lib/services/rock.service";
import { PageHeader } from "@/components/shared/page-header";
import { RockStatusBadge, TaskStatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { DeleteEntityButton } from "@/components/shared/delete-entity-button";
import { KpiChecklist } from "@/components/rocks/kpi-checklist";
import { InlineAssignmentRow } from "@/components/rocks/inline-assignment-row";
import { formatPercent, formatDate, getDaysAgo, parseKpiItems } from "@/lib/utils";
import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";

export default async function RockDetailPage({
  params,
}: {
  params: { rockId: string };
}) {
  let rock: Awaited<ReturnType<typeof rockService.getById>> = null;
  let users: { id: string; name: string }[] = [];

  try {
    rock = await rockService.getById(params.rockId);
  } catch {
    notFound();
  }
  if (!rock) notFound();

  try {
    users = await prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB not connected — inline edit owner dropdown will be empty
  }

  const kpiItems = parseKpiItems(rock.kpiMetric);

  return (
    <div className="space-y-3">
      <PageHeader
        title={rock.title}
        breadcrumbs={[
          { label: "Rocks", href: "/rocks" },
          { label: rock.title },
        ]}
      >
        <Link href={`/rocks/${rock.id}/updates/new`} className="btn-primary">
          <PlusIcon className="mr-1 h-3.5 w-3.5" />
          Weekly Update
        </Link>
        <Link href={`/rocks/${rock.id}/edit`} className="btn-secondary">
          <PencilIcon className="mr-1 h-3.5 w-3.5" />
          Edit
        </Link>
        <DeleteEntityButton
          entityName="Rock"
          endpoint={`/api/rocks/${rock.id}`}
          redirectTo="/rocks"
          allowedRoles={["EXECUTIVE", "MANAGER"]}
          confirmMessage="Delete this rock and its linked assignments and updates?"
        />
      </PageHeader>

      {/* Rock Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card space-y-3 lg:col-span-2">
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Description
            </h3>
            <p className="text-sm leading-relaxed text-text-primary">{rock.description}</p>
          </div>

          {rock.blockers && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-status-blocked">
                Blockers
              </h3>
              <p className="text-sm leading-relaxed text-text-primary">{rock.blockers}</p>
            </div>
          )}

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              KPI Metrics
            </h3>
            <KpiChecklist rockId={rock.id} initialItems={kpiItems} />
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Status</span>
            <RockStatusBadge status={rock.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Confidence</span>
            <ConfidenceIndicator confidence={rock.confidence} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Priority</span>
            <PriorityBadge priority={rock.priority} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Department</span>
            <DepartmentBadge department={rock.department} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Owner</span>
            <span className="text-sm text-text-primary">{rock.owner.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Quarter</span>
            <span className="text-sm text-text-primary">
              {rock.quarter} FY{rock.fiscalYear}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Goal</span>
            <Link
              href={`/goals/${rock.goal.id}`}
              className="text-sm text-accent hover:underline"
            >
              {rock.goal.title}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Target</span>
            <span className="text-sm text-text-primary">{formatDate(rock.targetDate)}</span>
          </div>
          {rock.isStale && (
            <div className="rounded-lg bg-status-at-risk/10 p-2.5 text-center text-xs font-medium text-status-at-risk">
              Stale — No update in 14+ days
            </div>
          )}
          <div className="border-t border-border pt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Completion</span>
              <span className="text-sm font-semibold text-text-primary">
                {formatPercent(rock.completionPct)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-background-tertiary">
              <div
                className="h-2 rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(rock.completionPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignments */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Team Assignments ({rock.assignments.length})
          </h3>
          <Link href={`/rocks/${rock.id}/assignments/new`} className="btn-primary">
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            New Assignment
          </Link>
        </div>
        {rock.assignments.length === 0 ? (
          <p className="py-3 text-center text-sm text-text-tertiary">No assignments yet</p>
        ) : (
          <div className="space-y-1.5">
            {rock.assignments.map((a) => (
              <InlineAssignmentRow
                key={a.id}
                assignment={{
                  id: a.id,
                  title: a.title,
                  status: a.status,
                  dueDate: a.dueDate ? a.dueDate.toISOString() : null,
                  owner: { id: a.owner.id, name: a.owner.name },
                  contributors: a.contributors,
                }}
                users={users}
              />
            ))}
          </div>
        )}
      </div>

      {/* Weekly Updates Timeline */}
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          Weekly Updates ({rock.weeklyUpdates.length})
        </h3>
        {rock.weeklyUpdates.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-sm text-text-tertiary">No updates yet</p>
            <Link
              href={`/rocks/${rock.id}/updates/new`}
              className="btn-primary mt-3 inline-flex"
            >
              Submit First Update
            </Link>
          </div>
        ) : (
          <div className="relative space-y-3 pl-6">
            <div className="absolute bottom-0 left-2 top-0 w-px bg-border" />
            {rock.weeklyUpdates.map((update) => (
              <div key={update.id} className="relative">
                <div className="absolute -left-[18px] top-2 h-2.5 w-2.5 rounded-full border-2 border-background-secondary bg-accent" />
                <div className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-primary">
                        Week of {formatDate(update.weekOf)}
                      </span>
                      {update.needsAttention && (
                        <span className="rounded bg-status-off-track/10 px-1.5 py-0.5 text-xs text-status-off-track">
                          Needs Attention
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <ConfidenceIndicator confidence={update.confidenceLevel} />
                      <span className="text-xs text-text-secondary">
                        {formatPercent(update.completionPct)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text-primary">{update.progressNotes}</p>
                  {update.blockers && (
                    <p className="mt-1.5 text-sm text-status-blocked">
                      <span className="font-medium">Blockers:</span> {update.blockers}
                    </p>
                  )}
                  {update.risks && (
                    <p className="mt-1 text-sm text-status-at-risk">
                      <span className="font-medium">Risks:</span> {update.risks}
                    </p>
                  )}
                  {update.decisions && (
                    <p className="mt-1 text-sm text-accent">
                      <span className="font-medium">Decisions Needed:</span>{" "}
                      {update.decisions}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-text-tertiary">
                    by {update.author.name} &middot; {getDaysAgo(update.createdAt)} days ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
