import { AttentionList } from "@/components/dashboard/attention-list";
import { DepartmentChart, GoalStatusChart } from "@/components/dashboard/charts";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { PageHeader } from "@/components/shared/page-header";
import { dashboardService } from "@/lib/services/dashboard.service";
import { formatDate, formatPercent } from "@/lib/utils";
import {
  ChartBarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";

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
      rockStats: {
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        blocked: 0,
        overdue: 0,
        avgCompletion: 0,
      },
      attentionItems: [],
      recentUpdates: [],
    };
    departmentSummary = [];
  }

  const { goalStats, rockStats, attentionItems, recentUpdates } = kpis;
  const securityScore =
    goalStats.total > 0
      ? Math.round(((goalStats.onTrack + goalStats.completed) / goalStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mission Control"
        description="Live program health across strategic goals, active rocks, and weekly execution signals."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <KPICard
          title="Security score"
          value={`${securityScore}%`}
          subtitle={`${goalStats.completed} directives complete`}
          trend={securityScore >= 75 ? "up" : securityScore >= 50 ? "neutral" : "down"}
          trendLabel={`${goalStats.onTrack} goals on track`}
          icon={<FlagIcon className="h-5 w-5" />}
          accentColor={securityScore >= 75 ? "text-status-on-track" : undefined}
        />
        <KPICard
          title="Linked rocks"
          value={rockStats.total}
          subtitle={`${rockStats.inProgress} in execution`}
          trend={rockStats.blocked > 0 ? "down" : "up"}
          trendLabel={`${rockStats.completed} completed`}
          icon={<CubeIcon className="h-5 w-5" />}
        />
        <KPICard
          title="Average completion"
          value={formatPercent(rockStats.avgCompletion)}
          subtitle="Across active quarterly work"
          trend={rockStats.avgCompletion >= 70 ? "up" : rockStats.avgCompletion >= 45 ? "neutral" : "down"}
          trendLabel={`${rockStats.overdue} overdue`}
          icon={<ChartBarIcon className="h-5 w-5" />}
          accentColor={
            rockStats.avgCompletion >= 70
              ? "text-status-on-track"
              : rockStats.avgCompletion >= 45
                ? "text-status-at-risk"
                : "text-status-off-track"
          }
        />
        <KPICard
          title="Attention queue"
          value={attentionItems.length}
          subtitle="Blocked, overdue, or stale"
          trend={attentionItems.length === 0 ? "up" : "down"}
          trendLabel={attentionItems.length === 0 ? "No escalations" : "Operator review needed"}
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          accentColor={attentionItems.length === 0 ? "text-status-on-track" : "text-status-off-track"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <GoalStatusChart stats={goalStats} />
            <DepartmentChart data={departmentSummary} />
          </div>
          <AttentionList items={attentionItems as any} />
        </div>

        <div className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Operational Log</p>
              <h3 className="mt-2 text-2xl font-semibold text-text-primary">Weekly update watch</h3>
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-text-secondary">
              Last 14 days
            </span>
          </div>

          {recentUpdates.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-border bg-background/60 px-5 py-10 text-center text-sm text-text-secondary">
              No flagged updates in the last two weeks.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recentUpdates.map((update: any) => (
                <div
                  key={update.id}
                  className="rounded-[24px] border border-border bg-background/60 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{update.rock.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-tertiary">
                        {update.author.name}
                      </p>
                    </div>
                    <ConfidenceIndicator confidence={update.confidenceLevel} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-text-secondary">{update.progressNotes}</p>
                  {update.blockers && (
                    <p className="mt-3 text-sm text-status-blocked">
                      <span className="font-semibold text-text-primary">Blockers:</span> {update.blockers}
                    </p>
                  )}
                  {update.risks && (
                    <p className="mt-2 text-sm text-status-at-risk">
                      <span className="font-semibold text-text-primary">Risks:</span> {update.risks}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary">
                    <span>Week of {formatDate(update.weekOf)}</span>
                    <span>{formatPercent(update.completionPct)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
