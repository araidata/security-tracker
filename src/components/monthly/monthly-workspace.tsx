"use client";

import { Fragment, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { RockStatusBadge } from "@/components/shared/status-badge";
import {
  DEPARTMENT_CONFIG,
  DEPARTMENT_ORDER,
  ROCK_STATUS_CONFIG,
} from "@/lib/constants";
import { cn, formatDate, formatPercent } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeptKey = keyof typeof DEPARTMENT_CONFIG;
type StatusKey = keyof typeof ROCK_STATUS_CONFIG;
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

interface RockRow {
  id: string;
  title: string;
  goal: { id: string; title: string };
  quarter: string;
  department: DeptKey;
  status: StatusKey;
  confidence: ConfidenceLevel;
  completionPct: number;
  owner: { id: string; name: string };
  updatedAt: Date | string;
  isStale: boolean;
}

interface RecentUpdate {
  id: string;
  rockId: string;
  weekOf: Date | string;
  completionPct: number;
  confidenceLevel: ConfidenceLevel;
  progressNotes: string;
  blockers?: string | null;
  risks?: string | null;
  decisions?: string | null;
  needsAttention: boolean;
  author: { name: string };
}

// ─── Urgency sort ─────────────────────────────────────────────────────────────

function urgencyScore(rock: RockRow): number {
  if (rock.status === "BLOCKED") return 0;
  if (rock.status === "OVERDUE") return 1;
  if (rock.status === "IN_PROGRESS" && rock.confidence === "LOW") return 2;
  if (rock.status === "IN_PROGRESS" && rock.confidence === "MEDIUM") return 3;
  if (rock.status === "IN_PROGRESS" && rock.confidence === "HIGH") return 4;
  if (rock.status === "NOT_STARTED") return 5;
  return 6; // COMPLETED
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeStats(rocks: RockRow[]) {
  const total = rocks.length;
  const onTrack = rocks.filter((r) => r.status === "IN_PROGRESS" && r.confidence !== "LOW").length;
  const atRisk = rocks.filter((r) => r.status === "BLOCKED" || r.status === "OVERDUE" || (r.status === "IN_PROGRESS" && r.confidence === "LOW")).length;
  const completed = rocks.filter((r) => r.status === "COMPLETED").length;
  return { total, onTrack, atRisk, completed };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MonthlyWorkspace({
  rocks,
  recentUpdates,
  reviews: _reviews,
}: {
  rocks: RockRow[];
  recentUpdates: RecentUpdate[];
  reviews: any[];
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [presentationMode, setPresentationMode] = useState(false);

  const stats = computeStats(rocks);

  // Latest update per rock
  const latestUpdateByRock: Record<string, RecentUpdate> = {};
  for (const u of recentUpdates) {
    const existing = latestUpdateByRock[u.rockId];
    if (!existing || new Date(u.weekOf) > new Date(existing.weekOf)) {
      latestUpdateByRock[u.rockId] = u;
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const content = (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 surface-outline px-4 py-2">
        <Stat label="Total Rocks" value={stats.total} />
        <div className="h-6 w-px bg-border" />
        <Stat label="On Track" value={stats.onTrack} color="text-status-on-track" />
        <div className="h-6 w-px bg-border" />
        <Stat label="At Risk" value={stats.atRisk} color={stats.atRisk > 0 ? "text-status-at-risk" : undefined} />
        <div className="h-6 w-px bg-border" />
        <Stat label="Completed" value={stats.completed} color="text-status-complete" />
        {!presentationMode && (
          <button
            onClick={() => setPresentationMode(true)}
            className="ml-auto rounded-lg border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Presentation Mode
          </button>
        )}
      </div>

      {/* Department groups */}
      {DEPARTMENT_ORDER.map((dept) => {
        const deptRocks = rocks
          .filter((r) => r.department === dept)
          .sort((a, b) => urgencyScore(a) - urgencyScore(b));

        if (deptRocks.length === 0) return null;

        return (
          <section key={dept}>
            <div className="mb-1 flex items-center gap-2">
              <DepartmentBadge department={dept} />
              <span className="text-[11px] text-text-tertiary">{deptRocks.length} rock{deptRocks.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="surface-outline overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-background-secondary/60">
                    <th className="w-6 px-3 py-2" />
                    <th className="px-3 py-2 text-left font-medium text-text-tertiary">Rock</th>
                    <th className="px-3 py-2 text-left font-medium text-text-tertiary">Owner</th>
                    <th className="px-3 py-2 text-left font-medium text-text-tertiary">Status</th>
                    <th className="px-3 py-2 text-right font-medium text-text-tertiary">%</th>
                    <th className="px-3 py-2 text-left font-medium text-text-tertiary">Confidence</th>
                    <th className="px-3 py-2 text-left font-medium text-text-tertiary">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {deptRocks.map((rock, idx) => {
                    const isExpanded = expandedIds.has(rock.id);
                    const latestUpdate = latestUpdateByRock[rock.id];
                    return (
                      <Fragment key={rock.id}>
                        <tr
                          key={rock.id}
                          onClick={() => toggleExpand(rock.id)}
                          className={cn(
                            "cursor-pointer border-b border-border transition-colors hover:bg-background-tertiary/40 last:border-0",
                            idx % 2 === 1 && "bg-background-secondary/20",
                            isExpanded && "bg-background-secondary/50"
                          )}
                        >
                          <td className="px-3 py-1.5 text-text-tertiary">
                            {isExpanded
                              ? <ChevronDownIcon className="h-3.5 w-3.5" />
                              : <ChevronRightIcon className="h-3.5 w-3.5" />
                            }
                          </td>
                          <td className="px-3 py-1.5 font-medium text-text-primary">{rock.title}</td>
                          <td className="px-3 py-1.5 text-text-secondary">{rock.owner.name}</td>
                          <td className="px-3 py-1.5">
                            <RockStatusBadge status={rock.status} compact />
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-medium text-text-primary">{formatPercent(rock.completionPct)}</td>
                          <td className="px-3 py-1.5">
                            <ConfidenceIndicator confidence={rock.confidence} />
                          </td>
                          <td className="px-3 py-1.5 text-text-tertiary">
                            {latestUpdate ? formatDate(latestUpdate.weekOf) : "—"}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${rock.id}-expand`} className="border-b border-border bg-background-secondary/60">
                            <td colSpan={7} className="px-6 py-3">
                              {latestUpdate ? (
                                <div className="space-y-2">
                                  <div className="text-[11px] text-text-tertiary">
                                    Week of {formatDate(latestUpdate.weekOf)} · {latestUpdate.author.name}
                                  </div>
                                  <p className="text-xs text-text-secondary">{latestUpdate.progressNotes}</p>
                                  {latestUpdate.blockers && (
                                    <p className="text-xs">
                                      <span className="font-medium text-status-blocked">Blockers:</span>{" "}
                                      <span className="text-text-secondary">{latestUpdate.blockers}</span>
                                    </p>
                                  )}
                                  {latestUpdate.risks && (
                                    <p className="text-xs">
                                      <span className="font-medium text-status-at-risk">Risks:</span>{" "}
                                      <span className="text-text-secondary">{latestUpdate.risks}</span>
                                    </p>
                                  )}
                                  {latestUpdate.decisions && (
                                    <p className="text-xs">
                                      <span className="font-medium text-accent">Decisions:</span>{" "}
                                      <span className="text-text-secondary">{latestUpdate.decisions}</span>
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-text-tertiary italic">No updates recorded for this rock.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );

  if (presentationMode) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-base font-semibold text-text-primary">Monthly — Leadership View</h1>
            <button
              onClick={() => setPresentationMode(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Exit Presentation
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("text-xl font-semibold tabular-nums text-text-primary", color)}>{value}</span>
      <span className="text-[11px] text-text-tertiary">{label}</span>
    </div>
  );
}
