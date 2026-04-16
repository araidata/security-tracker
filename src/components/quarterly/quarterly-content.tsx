"use client";

import { useState } from "react";
import { QuarterlyReviewDialog } from "@/components/reviews/quarterly-review-dialog";
import { GoalStatusBadge, RockStatusBadge } from "@/components/shared/status-badge";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { ROCK_STATUS_CONFIG } from "@/lib/constants";
import { cn, formatPercent } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusKey = keyof typeof ROCK_STATUS_CONFIG;

export interface GoalData {
  id: string;
  title: string;
  status: string;
  completionPct: number;
  department: string;
  _count: { rocks: number };
}

export interface RockData {
  id: string;
  title: string;
  status: StatusKey;
  completionPct: number;
  quarter: string;
  owner: { name: string };
  goalId: string;
}

export interface ReviewData {
  id: string;
  goalId: string;
  quarter: string;
  fiscalYear: number;
  overallStatus: string;
  plannedOutcomes: string;
  actualOutcomes: string;
  lessonsLearned?: string | null;
  adjustments?: string | null;
}

// ─── Clampable text ───────────────────────────────────────────────────────────

function ClampedText({ text, label }: { text: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 160;
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={cn("text-xs text-text-secondary leading-5", !expanded && isLong && "line-clamp-3")}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-0.5 text-[11px] text-accent hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

// ─── Status distribution ──────────────────────────────────────────────────────

function StatusDistribution({ rocks }: { rocks: RockData[] }) {
  const counts: Record<string, number> = {};
  for (const r of rocks) counts[r.status] = (counts[r.status] || 0) + 1;

  const colorMap: Record<string, string> = {
    IN_PROGRESS: "bg-status-on-track/20 text-status-on-track border-status-on-track/30",
    COMPLETED: "bg-status-complete/20 text-status-complete border-status-complete/30",
    BLOCKED: "bg-status-blocked/20 text-status-blocked border-status-blocked/30",
    OVERDUE: "bg-status-off-track/20 text-status-off-track border-status-off-track/30",
    NOT_STARTED: "bg-gray-500/10 text-text-tertiary border-border",
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {Object.entries(counts).map(([status, count]) => (
        <span
          key={status}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            colorMap[status] ?? "bg-gray-500/10 text-text-tertiary border-border"
          )}
        >
          {ROCK_STATUS_CONFIG[status as StatusKey]?.label ?? status} · {count}
        </span>
      ))}
    </div>
  );
}

// ─── Goal section ─────────────────────────────────────────────────────────────

function GoalSection({
  goal,
  rocks,
  review,
}: {
  goal: GoalData;
  rocks: RockData[];
  review: ReviewData | undefined;
}) {
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="border-b border-border py-3 last:border-0">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <GoalStatusBadge status={goal.status as any} compact />
        <span className="text-sm font-semibold text-text-primary">{goal.title}</span>
        <DepartmentBadge department={goal.department as any} />
        <span className="text-[11px] tabular-nums text-text-tertiary">{formatPercent(goal.completionPct)}</span>
        <span className="text-[11px] text-text-tertiary">{rocks.length} rock{rocks.length !== 1 ? "s" : ""}</span>
        {rocks.length > 0 && <StatusDistribution rocks={rocks} />}
      </div>

      {/* Rocks table */}
      {rocks.length > 0 && (
        <div className="surface-outline mb-2 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background-secondary/60">
                <th className="px-3 py-1.5 text-left font-medium text-text-tertiary">Rock</th>
                <th className="px-3 py-1.5 text-left font-medium text-text-tertiary">Owner</th>
                <th className="px-3 py-1.5 text-left font-medium text-text-tertiary">Status</th>
                <th className="px-3 py-1.5 text-right font-medium text-text-tertiary">%</th>
                <th className="px-3 py-1.5 text-left font-medium text-text-tertiary">Qtr</th>
              </tr>
            </thead>
            <tbody>
              {rocks.map((rock, i) => (
                <tr key={rock.id} className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-background-secondary/20")}>
                  <td className="px-3 py-1.5 font-medium text-text-primary">{rock.title}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{rock.owner.name}</td>
                  <td className="px-3 py-1.5"><RockStatusBadge status={rock.status} compact /></td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">{formatPercent(rock.completionPct)}</td>
                  <td className="px-3 py-1.5 text-text-tertiary">{rock.quarter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review */}
      {review ? (
        <div>
          <button
            type="button"
            onClick={() => setShowReview((s) => !s)}
            className="mb-2 flex items-center gap-1.5 text-[11px] text-text-tertiary hover:text-text-primary transition-colors"
          >
            <span>{showReview ? "▾" : "▸"}</span>
            <span className="uppercase tracking-wider font-semibold">{review.quarter} Review</span>
            <GoalStatusBadge status={review.overallStatus as any} compact />
          </button>

          {showReview && (
            <div className="space-y-3 rounded-lg border border-border bg-background-secondary/40 px-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <ClampedText label="Planned Outcomes" text={review.plannedOutcomes} />
                <ClampedText label="Actual Outcomes" text={review.actualOutcomes} />
              </div>
              {review.lessonsLearned && (
                <ClampedText label="Lessons Learned" text={review.lessonsLearned} />
              )}
              {review.adjustments && (
                <ClampedText label="Adjustments / Carry Forward" text={review.adjustments} />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-text-tertiary italic">No quarterly review recorded.</p>
          <QuarterlyReviewDialog goalId={goal.id} />
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function QuarterlyContent({
  goals,
  rocks,
  reviews,
}: {
  goals: GoalData[];
  rocks: RockData[];
  reviews: ReviewData[];
}) {
  const rocksByGoal: Record<string, RockData[]> = {};
  for (const rock of rocks) {
    if (!rocksByGoal[rock.goalId]) rocksByGoal[rock.goalId] = [];
    rocksByGoal[rock.goalId].push(rock);
  }

  const reviewByGoal: Record<string, ReviewData> = {};
  for (const review of reviews) {
    reviewByGoal[review.goalId] = review;
  }

  if (goals.length === 0) {
    return (
      <div className="surface-outline px-4 py-6 text-center text-sm text-text-tertiary">
        No goals found for this fiscal year.
      </div>
    );
  }

  return (
    <div className="surface-outline px-4 py-1">
      {goals.map((goal) => (
        <GoalSection
          key={goal.id}
          goal={goal}
          rocks={rocksByGoal[goal.id] ?? []}
          review={reviewByGoal[goal.id]}
        />
      ))}
    </div>
  );
}
