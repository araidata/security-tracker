import { dashboardService } from "@/lib/services/dashboard.service";
import { KPICard } from "@/components/dashboard/kpi-card";
import { AttentionList } from "@/components/dashboard/attention-list";
import { GoalStatusChart, DepartmentChart } from "@/components/dashboard/charts";
import { formatPercent } from "@/lib/utils";
import {
  FlagIcon,
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
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
    // Database not connected yet - show empty state
    kpis = {
      goalStats: { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, completed: 0 },
      rockStats: { total: 0, notStarted: 0, inProgress: 0, completed: 0, blocked: 0, overdue: 0, avgCompletion: 0 },
      attentionItems: [],
      recentUpdates: [],
    };
    departmentSummary = [];
  }

  const { goalStats, rockStats, attentionItems } = kpis;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Goals"
          value={goalStats.total}
          subtitle={`${goalStats.onTrack} on track`}
          icon={<FlagIcon className="h-5 w-5 text-text-secondary" />}
          trend={goalStats.onTrack > goalStats.atRisk ? "up" : "down"}
          trendLabel={`${goalStats.total > 0 ? Math.round((goalStats.onTrack / goalStats.total) * 100) : 0}% healthy`}
        />
        <KPICard
          title="Quarterly Rocks"
          value={rockStats.total}
          subtitle={`${rockStats.completed} completed`}
          icon={<CubeIcon className="h-5 w-5 text-text-secondary" />}
          trend={rockStats.completed > 0 ? "up" : "neutral"}
          trendLabel={`${rockStats.inProgress} in progress`}
        />
        <KPICard
          title="Avg Completion"
          value={formatPercent(rockStats.avgCompletion)}
          subtitle="Across all active rocks"
          icon={<ChartBarIcon className="h-5 w-5 text-text-secondary" />}
          accentColor={
            rockStats.avgCompletion >= 70
              ? "text-status-on-track"
              : rockStats.avgCompletion >= 40
              ? "text-status-at-risk"
              : "text-status-off-track"
          }
        />
        <KPICard
          title="Attention Items"
          value={attentionItems.length}
          subtitle="Blocked, overdue, or stale"
          icon={<ExclamationTriangleIcon className="h-5 w-5 text-text-secondary" />}
          accentColor={
            attentionItems.length === 0
              ? "text-status-on-track"
              : attentionItems.length <= 3
              ? "text-status-at-risk"
              : "text-status-off-track"
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GoalStatusChart stats={goalStats} />
        <DepartmentChart data={departmentSummary} />
      </div>

      {/* Attention Items */}
      <AttentionList items={attentionItems as any} />
    </div>
  );
}
