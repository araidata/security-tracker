import Link from "next/link";
import { updateService } from "@/lib/services/update.service";
import { PageHeader } from "@/components/shared/page-header";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatPercent, getDaysAgo } from "@/lib/utils";

export default async function UpdatesPage() {
  let updates: any[] = [];
  try {
    updates = await updateService.listRecent(50);
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader
        title="Weekly Updates"
        description="Recent progress reports across all rocks"
      />

      {updates.length === 0 ? (
        <EmptyState
          title="No updates yet"
          description="Weekly updates are submitted from a Rock's detail page"
        />
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <div key={update.id} className="card">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/rocks/${update.rock.id}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {update.rock.title}
                  </Link>
                  {update.needsAttention && (
                    <span className="rounded bg-status-off-track/10 px-1.5 py-0.5 text-xs text-status-off-track">
                      Needs Attention
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <ConfidenceIndicator confidence={update.confidenceLevel} />
                  <span className="text-xs text-text-secondary">
                    {formatPercent(update.completionPct)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-text-primary">{update.progressNotes}</p>

              {update.blockers && (
                <p className="mt-2 text-sm text-status-blocked">
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
                  <span className="font-medium">Decisions:</span> {update.decisions}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
                <span>{update.author.name}</span>
                <span>&middot;</span>
                <span>Week of {formatDate(update.weekOf)}</span>
                <span>&middot;</span>
                <span>{getDaysAgo(update.createdAt)} days ago</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
