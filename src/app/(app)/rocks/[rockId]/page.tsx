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
import { WeeklyUpdatesTable } from "@/components/rocks/weekly-updates-table";
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

      {/* Weekly Updates */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Weekly Updates ({rock.weeklyUpdates.length})
          </h3>
          <Link href={`/rocks/${rock.id}/updates/new`} className="btn-primary">
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            Add Update
          </Link>
        </div>
        <WeeklyUpdatesTable
          rockId={rock.id}
          initialUpdates={rock.weeklyUpdates.map((u) => ({
            id: u.id,
            weekOf: u.weekOf,
            completionPct: u.completionPct,
            confidenceLevel: u.confidenceLevel,
            progressNotes: u.progressNotes,
            blockers: u.blockers,
            needsAttention: u.needsAttention,
            author: u.author,
          }))}
        />
      </div>
    </div>
  );
}
