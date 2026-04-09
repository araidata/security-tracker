import Link from "next/link";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { RockStatusBadge } from "@/components/shared/status-badge";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface AttentionItem {
  id: string;
  title: string;
  status: string;
  confidence: string;
  isStale: boolean;
  owner: { id: string; name: string };
  goal: { id: string; title: string };
}

export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Priority Queue</p>
            <h3 className="mt-2 text-xl font-semibold text-text-primary">No active escalations</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-status-on-track/25 bg-status-on-track text-status-on-track">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-sm text-text-secondary">
          Blocked, overdue, and stale execution items will surface here when they need intervention.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Priority Queue</p>
          <h3 className="mt-2 text-2xl font-semibold text-text-primary">Items Requiring Attention</h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-status-off-track/30 bg-status-off-track px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-status-off-track">
          {items.length} active
        </span>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/rocks/${item.id}`}
            className="group flex flex-col gap-4 rounded-[22px] border border-border bg-background/55 px-4 py-4 transition-all duration-hover hover:border-border-strong hover:bg-background-tertiary/60 xl:flex-row xl:items-center xl:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-semibold text-text-primary">{item.title}</p>
                {item.isStale && (
                  <span className="inline-flex rounded-full border border-status-at-risk/30 bg-status-at-risk px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-status-at-risk">
                    Stale
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                {item.goal.title} · {item.owner.name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ConfidenceIndicator confidence={item.confidence as "HIGH" | "MEDIUM" | "LOW"} />
              <RockStatusBadge status={item.status as never} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
