"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CommandLineIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { RockStatusBadge } from "@/components/shared/status-badge";
import {
  CONFIDENCE_CONFIG,
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
  blockers?: string | null;
  _count: { weeklyUpdates: number };
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

interface EditDraft {
  completionPct: number;
  confidenceLevel: ConfidenceLevel;
  progressNotes: string;
  blockers: string;
  risks: string;
  decisions: string;
  needsAttention: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayISO(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function isoDate(d: Date | string): string {
  return new Date(d).toISOString().split("T")[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeeklyWorkspace({
  rocks,
  recentUpdates,
}: {
  rocks: RockRow[];
  recentUpdates: RecentUpdate[];
}) {
  const router = useRouter();
  const currentMonday = getMondayISO();

  // Filters
  const [deptFilter, setDeptFilter] = useState<"ALL" | DeptKey>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StatusKey>("ALL");
  const [attentionOnly, setAttentionOnly] = useState(false);

  // Meeting mode
  const [meetingMode, setMeetingMode] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Inline editor
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Filtered rows
  const filteredRocks = useMemo(() => {
    return rocks.filter((r) => {
      if (deptFilter !== "ALL" && r.department !== deptFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (attentionOnly && !r.isStale && r.status !== "BLOCKED" && r.status !== "OVERDUE") return false;
      return true;
    });
  }, [rocks, deptFilter, statusFilter, attentionOnly]);

  // Latest update per rock
  const latestUpdateByRock = useMemo(() => {
    const map: Record<string, RecentUpdate> = {};
    for (const u of recentUpdates) {
      const existing = map[u.rockId];
      if (!existing || new Date(u.weekOf) > new Date(existing.weekOf)) {
        map[u.rockId] = u;
      }
    }
    return map;
  }, [recentUpdates]);

  // Find update for current week
  const currentWeekUpdateByRock = useMemo(() => {
    const map: Record<string, RecentUpdate> = {};
    for (const u of recentUpdates) {
      if (isoDate(u.weekOf) === currentMonday) {
        map[u.rockId] = u;
      }
    }
    return map;
  }, [recentUpdates, currentMonday]);

  // Open inline editor
  function openEditor(rock: RockRow) {
    const existing = currentWeekUpdateByRock[rock.id];
    setDraft(
      existing
        ? {
            completionPct: existing.completionPct,
            confidenceLevel: existing.confidenceLevel,
            progressNotes: existing.progressNotes,
            blockers: existing.blockers ?? "",
            risks: existing.risks ?? "",
            decisions: existing.decisions ?? "",
            needsAttention: existing.needsAttention,
          }
        : {
            completionPct: rock.completionPct,
            confidenceLevel: rock.confidence,
            progressNotes: "",
            blockers: rock.blockers ?? "",
            risks: "",
            decisions: "",
            needsAttention: false,
          }
    );
    setExpandedId((prev) => (prev === rock.id ? null : rock.id));
    setSaveError("");
  }

  // Save update
  async function saveUpdate(rock: RockRow) {
    if (!draft) return;
    setSaving(true);
    setSaveError("");

    const existing = currentWeekUpdateByRock[rock.id];
    const url = existing
      ? `/api/rocks/${rock.id}/updates/${existing.id}`
      : `/api/rocks/${rock.id}/updates`;
    const method = existing ? "PUT" : "POST";

    const body = {
      weekOf: currentMonday,
      completionPct: draft.completionPct,
      confidenceLevel: draft.confidenceLevel,
      progressNotes: draft.progressNotes,
      blockers: draft.blockers || undefined,
      risks: draft.risks || undefined,
      decisions: draft.decisions || undefined,
      needsAttention: draft.needsAttention,
      ...(method === "POST" ? { rockId: rock.id } : {}),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ? JSON.stringify(err.error) : "Save failed");
      }
      setExpandedId(null);
      setDraft(null);
      router.refresh();
    } catch (e: any) {
      setSaveError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Meeting mode keyboard handler
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!meetingMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, filteredRocks.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const rock = filteredRocks[focusedIndex];
        if (rock) openEditor(rock);
      } else if (e.key === "Escape") {
        setExpandedId(null);
        setDraft(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [meetingMode, focusedIndex, filteredRocks]);

  // Reset focus when meeting mode changes
  useEffect(() => {
    if (meetingMode) setFocusedIndex(0);
  }, [meetingMode]);

  return (
    <div ref={tableRef} className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Dept filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeptFilter("ALL")}
            className={cn("rounded-lg border px-2 py-1 text-xs transition-colors", deptFilter === "ALL" ? "border-accent/30 bg-accent/12 text-text-primary" : "border-border text-text-secondary hover:text-text-primary")}
          >
            All
          </button>
          {DEPARTMENT_ORDER.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d === deptFilter ? "ALL" : d)}
              className={cn("rounded-lg border px-2 py-1 text-xs transition-colors", deptFilter === d ? "border-accent/30 bg-accent/12 text-text-primary" : "border-border text-text-secondary hover:text-text-primary")}
            >
              {DEPARTMENT_CONFIG[d].shortLabel}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ALL" | StatusKey)}
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-text-secondary focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          {Object.entries(ROCK_STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(e) => setAttentionOnly(e.target.checked)}
            className="h-3 w-3 rounded accent-accent"
          />
          Needs Attention
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMeetingMode((m) => !m)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors",
              meetingMode ? "border-accent/30 bg-accent/12 text-accent" : "border-border text-text-secondary hover:text-text-primary"
            )}
          >
            <CommandLineIcon className="h-3.5 w-3.5" />
            {meetingMode ? "Meeting Mode ON" : "Meeting Mode"}
          </button>
        </div>
      </div>

      {meetingMode && (
        <p className="text-[11px] text-text-tertiary">
          <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">j/k</kbd> navigate &nbsp;
          <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Enter</kbd> open editor &nbsp;
          <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Esc</kbd> close
        </p>
      )}

      {/* Table */}
      <div className="surface-outline overflow-hidden">
        {filteredRocks.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-text-tertiary">No rocks match the current filters.</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background-secondary/60">
                <th className="w-6 px-3 py-2" />
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Rock</th>
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Goal</th>
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Owner</th>
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Status</th>
                <th className="px-3 py-2 text-right font-medium text-text-tertiary">%</th>
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Confidence</th>
                <th className="px-3 py-2 text-left font-medium text-text-tertiary">Last Update</th>
                <th className="px-3 py-2 text-center font-medium text-text-tertiary">Attn</th>
              </tr>
            </thead>
            <tbody>
              {filteredRocks.map((rock, idx) => {
                const isExpanded = expandedId === rock.id;
                const isFocused = meetingMode && focusedIndex === idx;
                const latestUpdate = latestUpdateByRock[rock.id];
                const hasCurrentWeek = !!currentWeekUpdateByRock[rock.id];

                return (
                  <Fragment key={rock.id}>
                    <tr
                      onClick={() => openEditor(rock)}
                      className={cn(
                        "cursor-pointer border-b border-border transition-colors hover:bg-background-tertiary/40",
                        isFocused && "ring-1 ring-inset ring-accent/40 bg-accent/5",
                        isExpanded && "bg-background-secondary/50",
                        idx % 2 === 1 && !isFocused && !isExpanded && "bg-background-secondary/20"
                      )}
                    >
                      <td className="px-3 py-1.5 text-text-tertiary">
                        {isExpanded
                          ? <ChevronDownIcon className="h-3.5 w-3.5" />
                          : <ChevronRightIcon className="h-3.5 w-3.5" />
                        }
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/rocks/${rock.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-text-primary hover:text-accent transition-colors"
                          >
                            {rock.title}
                          </Link>
                          {rock.isStale && (
                            <span className="rounded-sm border border-status-at-risk/30 bg-status-at-risk/10 px-1 text-[9px] font-semibold uppercase text-status-at-risk">
                              Stale
                            </span>
                          )}
                          {hasCurrentWeek && (
                            <span className="rounded-sm border border-accent/20 bg-accent/10 px-1 text-[9px] font-semibold uppercase text-accent">
                              Updated
                            </span>
                          )}
                        </div>
                        <DepartmentBadge department={rock.department} />
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-1.5 text-text-secondary">{rock.goal.title}</td>
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
                      <td className="px-3 py-1.5 text-center">
                        {(rock.isStale || rock.status === "BLOCKED" || rock.status === "OVERDUE") ? (
                          <span className="h-2 w-2 rounded-full bg-status-at-risk inline-block" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-background-tertiary inline-block" />
                        )}
                      </td>
                    </tr>

                    {/* Inline editor */}
                    {isExpanded && draft && (
                      <tr key={`${rock.id}-editor`} className="border-b border-border bg-background-secondary/60">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                                Week of {currentMonday}
                                {hasCurrentWeek && <span className="ml-2 text-accent">(editing existing update)</span>}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setExpandedId(null); setDraft(null); }}
                                className="text-text-tertiary hover:text-text-primary"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="mb-1 block text-[11px] text-text-tertiary">% Complete</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={draft.completionPct}
                                  onChange={(e) => setDraft({ ...draft, completionPct: Number(e.target.value) })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="input-field py-1 text-xs"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] text-text-tertiary">Status</label>
                                <select
                                  value={rock.status}
                                  disabled
                                  className="input-field py-1 text-xs opacity-60"
                                >
                                  {Object.entries(ROCK_STATUS_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                                <p className="mt-0.5 text-[10px] text-text-tertiary">Derived from % complete</p>
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] text-text-tertiary">Confidence</label>
                                <select
                                  value={draft.confidenceLevel}
                                  onChange={(e) => setDraft({ ...draft, confidenceLevel: e.target.value as ConfidenceLevel })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="input-field py-1 text-xs"
                                >
                                  {Object.entries(CONFIDENCE_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] text-text-tertiary">Progress Notes *</label>
                              <textarea
                                value={draft.progressNotes}
                                onChange={(e) => setDraft({ ...draft, progressNotes: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="input-field min-h-[52px] py-1 text-xs"
                                placeholder="What moved this week?"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="mb-1 block text-[11px] text-text-tertiary">Blockers</label>
                                <textarea
                                  value={draft.blockers}
                                  onChange={(e) => setDraft({ ...draft, blockers: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="input-field min-h-[44px] py-1 text-xs"
                                  placeholder="Any blockers?"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] text-text-tertiary">Risks</label>
                                <textarea
                                  value={draft.risks}
                                  onChange={(e) => setDraft({ ...draft, risks: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="input-field min-h-[44px] py-1 text-xs"
                                  placeholder="Identified risks?"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] text-text-tertiary">Decisions</label>
                                <textarea
                                  value={draft.decisions}
                                  onChange={(e) => setDraft({ ...draft, decisions: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="input-field min-h-[44px] py-1 text-xs"
                                  placeholder="Decisions needed?"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={draft.needsAttention}
                                  onChange={(e) => setDraft({ ...draft, needsAttention: e.target.checked })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-3 w-3 rounded accent-accent"
                                />
                                Flag for operator attention
                              </label>
                              <div className="flex items-center gap-2">
                                {saveError && <span className="text-[11px] text-status-off-track">{saveError}</span>}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); saveUpdate(rock); }}
                                  disabled={saving || !draft.progressNotes.trim()}
                                  className="btn-primary py-1 text-xs disabled:opacity-50"
                                >
                                  {saving ? "Saving…" : "Save Update"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[11px] text-text-tertiary">{filteredRocks.length} of {rocks.length} rocks</p>
    </div>
  );
}
