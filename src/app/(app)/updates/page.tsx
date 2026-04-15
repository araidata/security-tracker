import Link from "next/link";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { updateService } from "@/lib/services/update.service";
import { formatDate, formatPercent, getDaysAgo } from "@/lib/utils";

export default async function UpdatesPage() {
  let updates: any[] = [];
  try {
    updates = await updateService.listRecent(50);
  } catch {
    // DB not connected
  }

  const attentionCount = updates.filter((update) => update.needsAttention).length;
  const avgCompletion =
    updates.length > 0
      ? Math.round(updates.reduce((sum, update) => sum + update.completionPct, 0) / updates.length)
      : 0;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Weekly Updates"
        description="Progress briefs, blockers, and decisions captured from each active rock."
      />

      {updates.length === 0 ? (
        <EmptyState
          title="No updates yet"
          description="Weekly updates are submitted from a rock detail page and will populate the operational log here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryPanel label="Recent updates" value={updates.length} detail="Most recent 50 entries" />
            <SummaryPanel label="Average completion" value={`${avgCompletion}%`} detail="Across submitted updates" />
            <SummaryPanel label="Needs attention" value={attentionCount} detail="Flagged for operator review" tone="risk" />
          </div>

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="space-y-3">
              {updates.map((update) => (
                <article key={update.id} className="card">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/rocks/${update.rock.id}`}
                          className="text-lg font-semibold text-text-primary transition-colors hover:text-accent"
                        >
                          {update.rock.title}
                        </Link>
                        {update.needsAttention && (
                          <span className="rounded-full border border-status-off-track/30 bg-status-off-track px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-status-off-track">
                            Needs attention
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">
                        Submitted by {update.author.name} · Week of {formatDate(update.weekOf)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ConfidenceIndicator confidence={update.confidenceLevel} />
                      <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-text-secondary">
                        {formatPercent(update.completionPct)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
                    <div className="rounded-[24px] border border-border bg-background/55 px-4 py-4">
                      <p className="eyebrow">Progress details</p>
                      <p className="mt-3 text-sm leading-7 text-text-secondary">{update.progressNotes}</p>
                    </div>
                    <div className="grid gap-3">
                      <SignalBox label="Current blockers" value={update.blockers || "No blockers reported"} tone={update.blockers ? "blocked" : "default"} />
                      <SignalBox label="Identified risks" value={update.risks || "No new risks reported"} tone={update.risks ? "risk" : "default"} />
                      <SignalBox label="Decisions needed" value={update.decisions || "No leadership decision requested"} tone={update.decisions ? "accent" : "default"} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-text-tertiary">
                    <span>Filed {getDaysAgo(update.createdAt)} days ago</span>
                    <span>{update.author.name}</span>
                  </div>
                </article>
              ))}
            </div>

            <aside className="card h-fit">
              <p className="eyebrow">Reporting Protocol</p>
              <h3 className="mt-2 text-2xl font-semibold text-text-primary">What operators should capture</h3>
              <div className="mt-6 space-y-3">
                <ChecklistItem title="Milestone progress" body="State what actually moved this week in concrete terms." />
                <ChecklistItem title="Blockers and risks" body="Call out dependencies, capacity limits, and likely schedule slips." />
                <ChecklistItem title="Decision asks" body="Separate leadership asks from narrative updates so triage stays fast." />
              </div>
            </aside>
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

function SignalBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "blocked" | "risk" | "accent";
}) {
  const toneClasses = {
    default: "border-border bg-background/55 text-text-secondary",
    blocked: "border-status-blocked/30 bg-status-blocked text-status-blocked",
    risk: "border-status-at-risk/30 bg-status-at-risk text-status-at-risk",
    accent: "border-accent/30 bg-status-complete text-accent",
  }[tone];

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${toneClasses}`}>
      <p className="metric-label">{
        label
      }</p>
      <p className="mt-3 text-sm leading-6">{value}</p>
    </div>
  );
}

function ChecklistItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-border bg-background/55 px-4 py-4">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{body}</p>
    </div>
  );
}
