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
            <h3 className="mt-1 text-base font-semibold text-text-primary">No active escalations</h3>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-status-on-track/25 bg-status-on-track/10 text-status-on-track">
            <ExclamationTriangleIcon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Blocked, overdue, and stale execution items will surface here when they need intervention.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Priority Queue</p>
          <h3 className="mt-1 text-base font-semibold text-text-primary">Items Requiring Attention</h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-status-off-track/30 bg-status-off-track/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-status-off-track">
          {items.length} active
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/rocks/${item.id}`}
            className="group flex items-center justify-between gap-3 rounded-[16px] border border-border bg-background/55 px-3 py-2 transition-all duration-hover hover:border-border-strong hover:bg-background-tertiary/60"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
                {item.isStale && (
                  <span className="inline-flex rounded-full border border-status-at-risk/30 bg-status-at-risk/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-status-at-risk">
                    Stale
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">
                {item.goal.title} · {item.owner.name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ConfidenceIndicator confidence={item.confidence as "HIGH" | "MEDIUM" | "LOW"} />
              <RockStatusBadge status={item.status as never} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
