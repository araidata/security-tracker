import Link from "next/link";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RockStatusBadge } from "@/components/shared/status-badge";
import { rockService } from "@/lib/services/rock.service";
import { formatDate, formatPercent } from "@/lib/utils";

export default async function RocksPage() {
  let rocks: any[] = [];
  try {
    rocks = await rockService.list({
      fiscalYear: new Date().getFullYear(),
    });
  } catch {
    // DB not connected
  }

  const activeRocks = rocks.filter((rock) => rock.status === "IN_PROGRESS").length;
  const blockedRocks = rocks.filter((rock) => rock.status === "BLOCKED" || rock.status === "OVERDUE").length;
  const staleRocks = rocks.filter((rock) => rock.isStale).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarterly Rocks"
        description="Execution-critical workstreams linked to annual goals, readiness signals, and weekly reporting cadence."
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
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryPanel label="Active rocks" value={activeRocks} detail="Work currently in flight" />
            <SummaryPanel label="Blocked or overdue" value={blockedRocks} detail="Immediate operator review" tone="risk" />
            <SummaryPanel label="Stale reporting" value={staleRocks} detail="14+ days without update" />
          </div>

          <div className="table-shell">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Operations Intelligence</p>
                <h2 className="mt-2 text-2xl font-semibold text-text-primary">Quarterly execution board</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
                <span className="rounded-full border border-border bg-background px-3 py-1.5">{rocks.length} tracked</span>
                <span className="rounded-full border border-border bg-background px-3 py-1.5">Current quarter</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-5 py-4 text-left">Rock Title</th>
                    <th className="px-4 py-4 text-left">Goal</th>
                    <th className="px-4 py-4 text-left">Quarter</th>
                    <th className="px-4 py-4 text-left">Status</th>
                    <th className="px-4 py-4 text-left">Confidence</th>
                    <th className="px-4 py-4 text-left">Department</th>
                    <th className="px-4 py-4 text-left">Completion</th>
                    <th className="px-4 py-4 text-left">Owner</th>
                    <th className="px-5 py-4 text-left">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {rocks.map((rock) => (
                    <tr key={rock.id} className="table-row align-top">
                      <td className="px-5 py-5">
                        <Link
                          href={`/rocks/${rock.id}`}
                          className="text-base font-semibold text-text-primary transition-colors hover:text-accent"
                        >
                          {rock.title}
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                          <span>{rock.goal.title}</span>
                          {rock.isStale && (
                            <span className="rounded-full border border-status-at-risk/30 bg-status-at-risk px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-status-at-risk">
                              Stale
                            </span>
                          )}
                        </div>
                        {rock.kpiMetric && (
                          <p className="mt-2 max-w-md text-sm leading-6 text-text-tertiary">
                            KPI: {rock.kpiMetric}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-5 text-sm text-text-secondary">
                        {rock.goal.title}
                      </td>
                      <td className="px-4 py-5 text-sm text-text-secondary">
                        {rock.quarter}
                      </td>
                      <td className="px-4 py-5">
                        <RockStatusBadge status={rock.status} />
                      </td>
                      <td className="px-4 py-5">
                        <ConfidenceIndicator confidence={rock.confidence} />
                      </td>
                      <td className="px-4 py-5">
                        <DepartmentBadge department={rock.department} />
                      </td>
                      <td className="px-4 py-5">
                        <div className="w-36">
                          <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
                            <span>Progress</span>
                            <span>{formatPercent(rock.completionPct)}</span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-bar"
                              style={{ width: `${Math.min(rock.completionPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm text-text-secondary">
                        {rock.owner.name}
                      </td>
                      <td className="px-5 py-5 text-sm text-text-secondary">
                        {formatDate(rock.targetDate)}
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
