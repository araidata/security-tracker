import Link from "next/link";
import { RockStatusBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
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
        <h3 className="mb-4 text-sm font-semibold text-text-primary">
          Items Requiring Attention
        </h3>
        <div className="flex flex-col items-center py-8 text-text-tertiary">
          <ExclamationTriangleIcon className="h-8 w-8 mb-2" />
          <p className="text-sm">No items requiring attention</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Items Requiring Attention
        <span className="ml-2 rounded-full bg-status-off-track/10 px-2 py-0.5 text-xs text-status-off-track">
          {items.length}
        </span>
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/rocks/${item.id}`}
            className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-background-tertiary"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {item.owner.name} &middot; {item.goal.title}
              </p>
            </div>
            <div className="ml-3 flex items-center gap-2">
              {item.isStale && (
                <span className="rounded bg-status-at-risk/10 px-1.5 py-0.5 text-xs text-status-at-risk">
                  Stale
                </span>
              )}
              <ConfidenceIndicator confidence={item.confidence as "HIGH" | "MEDIUM" | "LOW"} />
              <RockStatusBadge status={item.status as any} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
