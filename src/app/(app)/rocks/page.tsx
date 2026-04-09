import Link from "next/link";
import { rockService } from "@/lib/services/rock.service";
import { PageHeader } from "@/components/shared/page-header";
import { RockStatusBadge } from "@/components/shared/status-badge";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPercent, formatDate } from "@/lib/utils";

export default async function RocksPage() {
  let rocks: any[] = [];
  try {
    rocks = await rockService.list({
      fiscalYear: new Date().getFullYear(),
    });
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader
        title="Quarterly Rocks"
        description="Core execution items linked to annual goals"
        createHref="/rocks/new"
        createLabel="New Rock"
      />

      {rocks.length === 0 ? (
        <EmptyState
          title="No rocks yet"
          description="Create your first quarterly rock to start tracking execution"
          actionLabel="Create Rock"
          actionHref="/rocks/new"
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Rock</th>
                <th className="px-4 py-3 text-left">Quarter</th>
                <th className="px-4 py-3 text-left">Dept</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Confidence</th>
                <th className="px-4 py-3 text-left">Completion</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {rocks.map((rock) => (
                <tr key={rock.id} className="table-row">
                  <td className="px-4 py-3">
                    <Link
                      href={`/rocks/${rock.id}`}
                      className="text-sm font-medium text-text-primary hover:text-accent"
                    >
                      {rock.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      {rock.goal.title}
                    </p>
                    {rock.isStale && (
                      <span className="mt-1 inline-block rounded bg-status-at-risk/10 px-1.5 py-0.5 text-xs text-status-at-risk">
                        Stale - No update in 14+ days
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {rock.quarter}
                  </td>
                  <td className="px-4 py-3">
                    <DepartmentBadge department={rock.department} />
                  </td>
                  <td className="px-4 py-3">
                    <RockStatusBadge status={rock.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceIndicator confidence={rock.confidence} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-background-tertiary">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${Math.min(rock.completionPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">
                        {formatPercent(rock.completionPct)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {rock.owner.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary">
                    {formatDate(rock.targetDate)}
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
