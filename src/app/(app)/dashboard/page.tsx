import Link from "next/link";
import { RockStatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { PageHeader } from "@/components/shared/page-header";
import { DepartmentChart, GoalStatusChart } from "@/components/dashboard/charts";
import { dashboardService } from "@/lib/services/dashboard.service";
import { DEPARTMENT_CONFIG, DEPARTMENT_ORDER } from "@/lib/constants";
import { formatPercent, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ADMIN excluded from all dashboard metrics
const METRIC_DEPTS = DEPARTMENT_ORDER.filter((d) => d !== "ADMIN");

function getIssueLabel(item: any): string {
  if (item.status === "BLOCKED") return "Blocked";
  if (item.status === "OVERDUE") return "Overdue";
  if (item.isStale) return "Stale";
  if (item.confidence === "LOW") return "Low Confidence";
  return "Flagged";
}

function getIssueColor(item: any): string {
  if (item.status === "BLOCKED") return "text-status-blocked";
  if (item.status === "OVERDUE") return "text-status-off-track";
  if (item.isStale) return "text-status-at-risk";
  return "text-text-secondary";
}

function RiskPill({ count }: { count: number }) {
  if (count === 0)
    return <span className="rounded-full border border-status-on-track/30 bg-status-on-track/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-on-track">Low Risk</span>;
  if (count <= 2)
    return <span className="rounded-full border border-status-at-risk/30 bg-status-at-risk/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-at-risk">Moderate</span>;
  return <span className="rounded-full border border-status-off-track/30 bg-status-off-track/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-off-track">High Risk</span>;
}

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();

  let kpis: any;
  let departmentSummary: any[] = [];

  try {
    [kpis, departmentSummary] = await Promise.all([
      dashboardService.getKPIs({ fiscalYear: currentYear }),
      dashboardService.getDepartmentSummary(currentYear),
    ]);
  } catch {
    kpis = {
      goalStats: { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, completed: 0 },
      rockStats: { total: 0, notStarted: 0, inProgress: 0, completed: 0, blocked: 0, overdue: 0, avgCompletion: 0 },
      attentionItems: [],
      recentUpdates: [],
      needsAttentionRocks: [],
    };
    departmentSummary = [];
  }

  const { attentionItems, recentUpdates, needsAttentionRocks } = kpis;

  // Overall program progress (avg of department rock completions, excl ADMIN)
  const overallProgress = departmentSummary.length > 0
    ? Math.round(departmentSummary.reduce((s: number, d: any) => s + d.rockAvgCompletion, 0) / departmentSummary.length)
    : 0;

  const atRiskByDept: Record<string, number> = {};
  for (const item of attentionItems) {
    atRiskByDept[item.department] = (atRiskByDept[item.department] || 0) + 1;
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Mission Control" />

      {/* Needs Attention */}
      {needsAttentionRocks.length > 0 && (
        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Needs Attention</p>
            <span className="rounded-full border border-status-off-track/30 bg-status-off-track/10 px-2 py-0.5 text-[10px] font-semibold text-status-off-track">
              {needsAttentionRocks.length} rock{needsAttentionRocks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="surface-outline overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-background-secondary/60">
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Rock</th>
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Goal</th>
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Owner</th>
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Status</th>
                </tr>
              </thead>
              <tbody>
                {needsAttentionRocks.map((rock: any, i: number) => (
                  <tr key={rock.id} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-background-secondary/30" : ""}`}>
                    <td className="px-3 py-1.5 font-medium text-text-primary">
                      <Link href={`/rocks/${rock.id}`} className="hover:text-accent transition-colors">
                        {rock.title}
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 text-text-secondary">{rock.goal?.title ?? "—"}</td>
                    <td className="px-3 py-1.5 text-text-secondary">{rock.owner?.name ?? "—"}</td>
                    <td className="px-3 py-1.5">
                      <RockStatusBadge status={rock.status} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Attention Queue */}
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Attention Queue</p>
          {attentionItems.length > 0 && (
            <span className="rounded-full border border-status-off-track/30 bg-status-off-track/10 px-2 py-0.5 text-[10px] font-semibold text-status-off-track">
              {attentionItems.length} item{attentionItems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="surface-outline overflow-hidden">
          {attentionItems.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text-tertiary">No items require attention.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-background-secondary/60">
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Rock</th>
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Goal</th>
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Owner</th>
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Issue</th>
                  <th className="px-3 py-2 text-left font-medium text-text-tertiary">Status</th>
                  <th className="px-3 py-2 text-right font-medium text-text-tertiary">%</th>
                </tr>
              </thead>
              <tbody>
                {attentionItems.map((item: any, i: number) => (
                  <tr key={item.id} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-background-secondary/30" : ""}`}>
                    <td className="px-3 py-1.5 font-medium text-text-primary">
                      <Link href={`/rocks/${item.id}`} className="hover:text-accent transition-colors">{item.title}</Link>
                    </td>
                    <td className="px-3 py-1.5 text-text-secondary">{item.goal?.title ?? "—"}</td>
                    <td className="px-3 py-1.5 text-text-secondary">{item.owner?.name ?? "—"}</td>
                    <td className={`px-3 py-1.5 font-medium ${getIssueColor(item)}`}>{getIssueLabel(item)}</td>
                    <td className="px-3 py-1.5"><RockStatusBadge status={item.status} compact /></td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">{formatPercent(item.completionPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Progress Graphs */}
      <section>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Program Progress</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Overall progress */}
          <div className="card flex flex-col justify-between">
            <div>
              <p className="eyebrow">Overall</p>
              <h3 className="mt-2 text-xl font-semibold text-text-primary">
                {formatPercent(overallProgress)} complete
              </h3>
              <p className="mt-1 text-xs text-text-tertiary">Avg across all departments (excl. Admin)</p>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-background-tertiary">
              <div
                className="h-3 rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
            <div className="mt-3 space-y-1.5">
              {departmentSummary.map((d: any) => (
                <div key={d.department} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[11px] text-text-tertiary">
                    {DEPARTMENT_CONFIG[d.department as keyof typeof DEPARTMENT_CONFIG]?.shortLabel ?? d.department}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-background-tertiary">
                    <div
                      className="h-1.5 rounded-full bg-accent/70"
                      style={{ width: `${Math.min(d.rockAvgCompletion, 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] tabular-nums text-text-secondary">
                    {formatPercent(d.rockAvgCompletion)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Department chart */}
          <div className="lg:col-span-2">
            <DepartmentChart data={departmentSummary} />
          </div>
        </div>
      </section>

      {/* Execution Summary */}
      <section>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Execution Summary</p>
        <div className="surface-outline overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background-secondary/60">
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Department</th>
                <th className="px-3 py-2 text-right font-medium text-text-tertiary">Rocks</th>
                <th className="px-3 py-2 text-right font-medium text-text-tertiary">Avg %</th>
                <th className="px-3 py-2 text-right font-medium text-text-tertiary">At Risk / Blocked</th>
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_DEPTS.map((dept, i) => {
                const summary = departmentSummary.find((s: any) => s.department === dept);
                const atRisk = atRiskByDept[dept] || 0;
                return (
                  <tr key={dept} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-background-secondary/30" : ""}`}>
                    <td className="px-3 py-1.5 font-medium text-text-primary">{DEPARTMENT_CONFIG[dept].label}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">{summary?.rockCount ?? 0}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">
                      {summary ? formatPercent(summary.rockAvgCompletion) : "—"}
                    </td>
                    <td className={`px-3 py-1.5 text-right tabular-nums font-semibold ${atRisk > 0 ? "text-status-at-risk" : "text-text-tertiary"}`}>
                      {atRisk}
                    </td>
                    <td className="px-3 py-1.5"><RiskPill count={atRisk} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Activity */}
      {recentUpdates.length > 0 && (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Recent Activity</p>
          <div className="surface-outline divide-y divide-border overflow-hidden">
            {recentUpdates.slice(0, 5).map((update: any) => (
              <div key={update.id} className="flex items-center gap-3 px-3 py-2">
                <Link href={`/rocks/${update.rock.id}`} className="min-w-0 flex-1 truncate text-xs font-medium text-text-primary transition-colors hover:text-accent">
                  {update.rock.title}
                </Link>
                <span className="shrink-0 tabular-nums text-[11px] text-text-secondary">{formatPercent(update.completionPct)}</span>
                <span className="shrink-0 text-[11px] text-text-tertiary">{update.author.name}</span>
                <span className="min-w-0 max-w-[28rem] truncate text-[11px] text-text-tertiary">{update.progressNotes}</span>
                <ConfidenceIndicator confidence={update.confidenceLevel} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
