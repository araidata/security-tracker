"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  TableCellsIcon,
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

// ─── Types ───────────────────────────────────────────────────────────────────

type DepartmentKey = keyof typeof DEPARTMENT_CONFIG;
type RockStatusKey = keyof typeof ROCK_STATUS_CONFIG;
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
type DepartmentFilter = "ALL" | DepartmentKey;
type GroupMode = "DEPT" | "GOAL" | "FLAT";
type SortDir = "asc" | "desc";

interface RockRow {
  id: string;
  title: string;
  goal: { id: string; title: string };
  quarter: string;
  department: DepartmentKey;
  status: RockStatusKey;
  confidence: ConfidenceLevel;
  completionPct: number;
  owner: { id: string; name: string };
  targetDate: Date | string;
  updatedAt: Date | string;
  isStale: boolean;
  kpiMetric?: string | null;
  blockers?: string | null;
  _count: { weeklyUpdates: number; assignments: number };
}

interface MeetingDraft {
  weekOf: string;
  status: RockStatusKey;
  completionPct: number;
  confidenceLevel: ConfidenceLevel;
  progressNotes: string;
  blockers: string;
  risks: string;
  decisions: string;
  needsAttention: boolean;
}

interface WeeklyUpdate {
  id: string;
  weekOf: string;
  progressNotes: string;
  confidenceLevel: ConfidenceLevel;
  completionPct: number;
  blockers?: string | null;
  risks?: string | null;
  decisions?: string | null;
  needsAttention: boolean;
  author: { name: string };
}

interface RockDetail extends RockRow {
  description?: string;
  weeklyUpdates: WeeklyUpdate[];
  assignments: { id: string; title: string; owner: { name: string }; status: string }[];
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

function getField(rock: RockRow, key: string): string | number | Date {
  switch (key) {
    case "goal.title": return rock.goal.title;
    case "owner.name": return rock.owner.name;
    case "updatedAt": return new Date(rock.updatedAt);
    case "targetDate": return new Date(rock.targetDate);
    case "completionPct": return rock.completionPct;
    case "department":
      return DEPARTMENT_ORDER.indexOf(rock.department);
    default: return (rock as unknown as Record<string, string | number>)[key] ?? "";
  }
}

function sortRocks(rocks: RockRow[], key: string, dir: SortDir): RockRow[] {
  return [...rocks].sort((a, b) => {
    const av = getField(a, key);
    const bv = getField(b, key);
    let cmp = 0;
    if (av instanceof Date && bv instanceof Date) {
      cmp = av.getTime() - bv.getTime();
    } else if (typeof av === "number" && typeof bv === "number") {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function exportCSV(rocks: RockRow[]) {
  const headers = ["Title", "Goal", "Dept", "Owner", "Status", "%", "Confidence", "Quarter", "Last Update", "Stale", "Blockers"];
  const rows = rocks.map((r) => [
    r.title,
    r.goal.title,
    r.department,
    r.owner.name,
    ROCK_STATUS_CONFIG[r.status].label,
    r.completionPct,
    r.confidence,
    r.quarter,
    formatDate(r.updatedAt),
    r.isStale ? "Yes" : "No",
    r.blockers ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rocks-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getDefaultWeekOf() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return monday.toISOString().split("T")[0];
}

// ─── Main workspace ───────────────────────────────────────────────────────────

export function RocksWorkspace({ rocks: initialRocks }: { rocks: RockRow[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const tableRef = useRef<HTMLDivElement>(null);

  // local mutable copy for optimistic updates
  const [rocks, setRocks] = useState<RockRow[]>(initialRocks);

  // filters
  const [deptFilter, setDeptFilter] = useState<DepartmentFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [quarterFilter, setQuarterFilter] = useState<string>("ALL");
  const [groupMode, setGroupMode] = useState<GroupMode>("DEPT");

  // sort
  const [sortKey, setSortKey] = useState<string>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ui state
  const [meetingMode, setMeetingMode] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  // quick update panel (inline row expansion)
  const [openEditorRockId, setOpenEditorRockId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MeetingDraft | null>(null);
  const [submittingRockId, setSubmittingRockId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // detail panel
  const [selectedRockId, setSelectedRockId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RockDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [panelNote, setPanelNote] = useState("");
  const [panelNoteSubmitting, setPanelNoteSubmitting] = useState(false);
  const [panelNoteError, setPanelNoteError] = useState("");

  const canPatchRock =
    session?.user?.role === "EXECUTIVE" || session?.user?.role === "MANAGER";

  // unique owners for filter
  const owners = useMemo(() => {
    const names = Array.from(new Set(rocks.map((r) => r.owner.name))).sort();
    return names;
  }, [rocks]);

  // filtered + sorted list
  const filteredSortedRocks = useMemo(() => {
    const filtered = rocks.filter((r) => {
      if (deptFilter !== "ALL" && r.department !== deptFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (ownerFilter !== "ALL" && r.owner.name !== ownerFilter) return false;
      if (quarterFilter !== "ALL" && r.quarter !== quarterFilter) return false;
      return true;
    });
    return sortRocks(filtered, sortKey, sortDir);
  }, [rocks, deptFilter, statusFilter, ownerFilter, quarterFilter, sortKey, sortDir]);

  // groupings
  const groupedByDept = useMemo(
    () =>
      DEPARTMENT_ORDER.map((dept) => ({
        key: dept,
        label: DEPARTMENT_CONFIG[dept].label,
        items: filteredSortedRocks.filter((r) => r.department === dept),
      })).filter((g) => g.items.length > 0),
    [filteredSortedRocks]
  );

  const groupedByGoal = useMemo(() => {
    const map = new Map<string, { goalId: string; goalTitle: string; items: RockRow[] }>();
    for (const rock of filteredSortedRocks) {
      if (!map.has(rock.goal.id)) {
        map.set(rock.goal.id, { goalId: rock.goal.id, goalTitle: rock.goal.title, items: [] });
      }
      map.get(rock.goal.id)!.items.push(rock);
    }
    return Array.from(map.values());
  }, [filteredSortedRocks]);

  // sort toggle
  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // inline cell patch
  async function patchRock(rockId: string, data: Record<string, unknown>) {
    // optimistic
    setRocks((prev) =>
      prev.map((r) => (r.id === rockId ? { ...r, ...data } : r))
    );
    if (selectedRockId === rockId && detail) {
      setDetail((d) => (d ? { ...d, ...data } : d));
    }
    try {
      const res = await fetch(`/api/rocks/${rockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        // rollback
        setRocks(initialRocks);
        if (detail) setDetail(null);
      }
    } catch {
      setRocks(initialRocks);
    }
  }

  // quick update
  function openQuickEditor(rock: RockRow) {
    if (openEditorRockId === rock.id) {
      setOpenEditorRockId(null);
      setDraft(null);
      setFormError("");
      setFormSuccess("");
      return;
    }
    setOpenEditorRockId(rock.id);
    setDraft({
      weekOf: getDefaultWeekOf(),
      status: rock.status,
      completionPct: rock.completionPct,
      confidenceLevel: rock.confidence,
      progressNotes: "",
      blockers: rock.blockers ?? "",
      risks: "",
      decisions: "",
      needsAttention: false,
    });
    setFormError("");
    setFormSuccess("");
  }

  async function submitQuickUpdate(rock: RockRow) {
    if (!draft) return;
    if (!draft.progressNotes.trim()) {
      setFormError("Progress notes are required.");
      return;
    }
    setSubmittingRockId(rock.id);
    setFormError("");
    setFormSuccess("");
    try {
      if (canPatchRock) {
        const patchRes = await fetch(`/api/rocks/${rock.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: draft.status,
            completionPct: draft.completionPct,
            confidence: draft.confidenceLevel,
            blockers: draft.blockers || undefined,
          }),
        });
        if (!patchRes.ok) throw new Error("Unable to update rock.");
        setRocks((prev) =>
          prev.map((r) =>
            r.id === rock.id
              ? {
                  ...r,
                  status: draft.status,
                  completionPct: draft.completionPct,
                  confidence: draft.confidenceLevel,
                  blockers: draft.blockers || r.blockers,
                }
              : r
          )
        );
      }
      const updateRes = await fetch(`/api/rocks/${rock.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekOf: draft.weekOf,
          progressNotes: draft.progressNotes,
          blockers: draft.blockers || undefined,
          risks: draft.risks || undefined,
          decisions: draft.decisions || undefined,
          completionPct: draft.completionPct,
          confidenceLevel: draft.confidenceLevel,
          needsAttention: draft.needsAttention,
        }),
      });
      if (!updateRes.ok) {
        const payload = await updateRes.json().catch(() => null);
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Unable to submit update."
        );
      }
      setFormSuccess("Update saved.");
      setOpenEditorRockId(null);
      setDraft(null);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmittingRockId(null);
    }
  }

  // detail panel
  async function openDetail(rock: RockRow) {
    if (selectedRockId === rock.id) {
      setSelectedRockId(null);
      setDetail(null);
      return;
    }
    setSelectedRockId(rock.id);
    setDetail(null);
    setPanelNote("");
    setPanelNoteError("");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/rocks/${rock.id}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitPanelNote() {
    if (!detail || !panelNote.trim()) return;
    setPanelNoteSubmitting(true);
    setPanelNoteError("");
    try {
      const res = await fetch(`/api/rocks/${detail.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekOf: getDefaultWeekOf(),
          progressNotes: panelNote.trim(),
          completionPct: detail.completionPct,
          confidenceLevel: detail.confidence,
          needsAttention: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to save note.");
      setPanelNote("");
      // refresh detail
      const refreshed = await fetch(`/api/rocks/${detail.id}`);
      if (refreshed.ok) setDetail(await refreshed.json());
      router.refresh();
    } catch (err) {
      setPanelNoteError(err instanceof Error ? err.message : "Error saving note.");
    } finally {
      setPanelNoteSubmitting(false);
    }
  }

  // meeting mode keyboard nav
  useEffect(() => {
    if (!meetingMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, filteredSortedRocks.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const rock = filteredSortedRocks[focusedIdx];
        if (rock) openQuickEditor(rock);
      } else if (e.key === "p" || e.key === "P") {
        const rock = filteredSortedRocks[focusedIdx];
        if (rock) openDetail(rock);
      } else if (e.key === "Escape") {
        setMeetingMode(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [meetingMode, focusedIdx, filteredSortedRocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // scroll focused row into view
  useEffect(() => {
    if (!meetingMode) return;
    const el = tableRef.current?.querySelector(`[data-row-idx="${focusedIdx}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIdx, meetingMode]);

  // reset focused idx when filters change
  useEffect(() => { setFocusedIdx(0); }, [filteredSortedRocks.length]);

  const panelOpen = !!selectedRockId;

  const sharedTableProps = {
    sortKey, sortDir, onSort: handleSort,
    canPatchRock, openEditorRockId, draft,
    submittingRockId, formError, formSuccess,
    onOpenQuickEditor: openQuickEditor,
    onDraftChange: setDraft,
    onSubmitQuickUpdate: submitQuickUpdate,
    onPatchRock: patchRock,
    onOpenDetail: openDetail,
    selectedRockId, meetingMode, focusedIdx,
  };

  return (
    <div className="space-y-3">
      <FilterToolbar
        deptFilter={deptFilter}
        statusFilter={statusFilter}
        ownerFilter={ownerFilter}
        quarterFilter={quarterFilter}
        groupMode={groupMode}
        meetingMode={meetingMode}
        owners={owners}
        totalVisible={filteredSortedRocks.length}
        onDeptFilter={setDeptFilter}
        onStatusFilter={setStatusFilter}
        onOwnerFilter={setOwnerFilter}
        onQuarterFilter={setQuarterFilter}
        onGroupMode={setGroupMode}
        onMeetingMode={setMeetingMode}
        onExport={() => exportCSV(filteredSortedRocks)}
      />

      <div className={cn("flex gap-3 items-start", panelOpen && "")}>
        <div className={cn("min-w-0", panelOpen ? "flex-1" : "w-full")} ref={tableRef}>
          {groupMode === "DEPT" ? (
            <div className="space-y-3">
              {groupedByDept.map((group) => (
                <section key={group.key} className="table-shell">
                  <GroupHeader label={group.label} count={group.items.length} subtitle="department" />
                  <RocksTable rocks={group.items} {...sharedTableProps} />
                </section>
              ))}
            </div>
          ) : groupMode === "GOAL" ? (
            <div className="space-y-3">
              {groupedByGoal.map((group) => {
                const isExpanded = expandedGoals.has(group.goalId) || expandedGoals.size === 0;
                return (
                  <section key={group.goalId} className="table-shell">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 border-b border-border px-4 py-1.5 text-left transition-colors hover:bg-background-tertiary/40"
                      onClick={() =>
                        setExpandedGoals((prev) => {
                          const next = new Set(prev);
                          if (prev.size === 0) {
                            // first click: collapse others, expand this
                            groupedByGoal.forEach((g) => {
                              if (g.goalId !== group.goalId) next.add(g.goalId + "__collapsed");
                            });
                          }
                          if (next.has(group.goalId + "__collapsed")) {
                            next.delete(group.goalId + "__collapsed");
                          } else {
                            next.add(group.goalId + "__collapsed");
                          }
                          return next;
                        })
                      }
                    >
                      {expandedGoals.has(group.goalId + "__collapsed") ? (
                        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                      ) : (
                        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                      )}
                      <span className="text-xs font-semibold text-text-primary truncate">{group.goalTitle}</span>
                      <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
                        {group.items.length} rock{group.items.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                    {!expandedGoals.has(group.goalId + "__collapsed") && (
                      <RocksTable rocks={group.items} {...sharedTableProps} />
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="table-shell">
              <GroupHeader label="All Rocks" count={filteredSortedRocks.length} subtitle="cross-functional" />
              <RocksTable rocks={filteredSortedRocks} {...sharedTableProps} />
            </div>
          )}
        </div>

        {panelOpen && (
          <DetailPanel
            rockId={selectedRockId!}
            detail={detail}
            loading={detailLoading}
            note={panelNote}
            noteSubmitting={panelNoteSubmitting}
            noteError={panelNoteError}
            canPatchRock={canPatchRock}
            onNoteChange={setPanelNote}
            onNoteSubmit={submitPanelNote}
            onPatch={patchRock}
            onClose={() => { setSelectedRockId(null); setDetail(null); }}
          />
        )}
      </div>

      {meetingMode && (
        <div className="fixed bottom-4 right-4 rounded-2xl border border-accent/40 bg-background-secondary/95 px-4 py-3 text-xs text-text-secondary shadow-xl backdrop-blur">
          <span className="font-semibold text-accent">Meeting Mode</span>
          <span className="ml-3">j/↓ next · k/↑ prev · Enter update · p panel · Esc exit</span>
          <span className="ml-3 text-text-tertiary">
            {focusedIdx + 1}/{filteredSortedRocks.length}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Filter Toolbar ───────────────────────────────────────────────────────────

function FilterToolbar({
  deptFilter, statusFilter, ownerFilter, quarterFilter, groupMode, meetingMode,
  owners, totalVisible,
  onDeptFilter, onStatusFilter, onOwnerFilter, onQuarterFilter, onGroupMode,
  onMeetingMode, onExport,
}: {
  deptFilter: DepartmentFilter; statusFilter: string; ownerFilter: string;
  quarterFilter: string; groupMode: GroupMode; meetingMode: boolean;
  owners: string[]; totalVisible: number;
  onDeptFilter: (v: DepartmentFilter) => void; onStatusFilter: (v: string) => void;
  onOwnerFilter: (v: string) => void; onQuarterFilter: (v: string) => void;
  onGroupMode: (v: GroupMode) => void; onMeetingMode: (v: boolean) => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background-secondary/80 px-3 py-1.5">
      {/* Dept chips */}
      <div className="flex items-center gap-1.5">
        <DeptChip label="All" active={deptFilter === "ALL"} onClick={() => onDeptFilter("ALL")} />
        {DEPARTMENT_ORDER.map((d) => (
          <DeptChip
            key={d}
            label={DEPARTMENT_CONFIG[d].shortLabel}
            active={deptFilter === d}
            onClick={() => onDeptFilter(d)}
          />
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Status */}
      <FilterSelect
        value={statusFilter}
        onChange={onStatusFilter}
        options={[
          { value: "ALL", label: "All Status" },
          ...Object.entries(ROCK_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
        ]}
      />

      {/* Owner */}
      <FilterSelect
        value={ownerFilter}
        onChange={onOwnerFilter}
        options={[
          { value: "ALL", label: "All Owners" },
          ...owners.map((o) => ({ value: o, label: o })),
        ]}
      />

      {/* Quarter */}
      <FilterSelect
        value={quarterFilter}
        onChange={onQuarterFilter}
        options={[
          { value: "ALL", label: "All Quarters" },
          { value: "Q1", label: "Q1" },
          { value: "Q2", label: "Q2" },
          { value: "Q3", label: "Q3" },
          { value: "Q4", label: "Q4" },
        ]}
      />

      {/* Group by */}
      <FilterSelect
        value={groupMode}
        onChange={(v) => onGroupMode(v as GroupMode)}
        options={[
          { value: "DEPT", label: "By Dept" },
          { value: "GOAL", label: "By Goal" },
          { value: "FLAT", label: "Flat" },
        ]}
      />

      <div className="h-4 w-px bg-border" />

      <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
        {totalVisible} rocks
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onMeetingMode(!meetingMode)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
            meetingMode
              ? "border-accent/50 bg-accent text-background"
              : "border-border bg-background text-text-secondary hover:border-border-strong hover:text-text-primary"
          )}
        >
          <TableCellsIcon className="h-3.5 w-3.5" />
          Meeting
        </button>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}

function DeptChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        active
          ? "border-accent/40 bg-accent text-background"
          : "border-border bg-background text-text-secondary hover:border-border-strong hover:text-text-primary"
      )}
    >
      {label}
    </button>
  );
}

function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="inline-edit-select rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-secondary focus:border-accent focus:text-text-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function GroupHeader({ label, count, subtitle }: { label: string; count: number; subtitle: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2">
      <span className="text-xs font-semibold text-text-primary">{label}</span>
      <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
        {count} {subtitle}
      </span>
    </div>
  );
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({
  label, sortKey: key, currentKey, currentDir, onSort, className,
}: {
  label: string; sortKey: string; currentKey: string; currentDir: SortDir;
  onSort: (k: string) => void; className?: string;
}) {
  const active = currentKey === key;
  return (
    <th
      className={cn("cursor-pointer select-none px-3 py-2 text-left whitespace-nowrap", className)}
      onClick={() => onSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentDir === "asc"
            ? <ArrowUpIcon className="h-3 w-3" />
            : <ArrowDownIcon className="h-3 w-3" />
        ) : (
          <span className="h-3 w-3 opacity-0 group-hover:opacity-30">↕</span>
        )}
      </span>
    </th>
  );
}

// ─── Rocks Table ──────────────────────────────────────────────────────────────

function RocksTable({
  rocks, sortKey, sortDir, onSort,
  canPatchRock, openEditorRockId, draft, submittingRockId, formError, formSuccess,
  onOpenQuickEditor, onDraftChange, onSubmitQuickUpdate,
  onPatchRock, onOpenDetail, selectedRockId, meetingMode, focusedIdx,
}: {
  rocks: RockRow[];
  sortKey: string; sortDir: SortDir; onSort: (k: string) => void;
  canPatchRock: boolean;
  openEditorRockId: string | null; draft: MeetingDraft | null;
  submittingRockId: string | null; formError: string; formSuccess: string;
  onOpenQuickEditor: (r: RockRow) => void;
  onDraftChange: React.Dispatch<React.SetStateAction<MeetingDraft | null>>;
  onSubmitQuickUpdate: (r: RockRow) => Promise<void>;
  onPatchRock: (id: string, data: Record<string, unknown>) => Promise<void>;
  onOpenDetail: (r: RockRow) => void;
  selectedRockId: string | null;
  meetingMode: boolean; focusedIdx: number;
}) {
  const thProps = { currentKey: sortKey, currentDir: sortDir, onSort };

  // global flat index tracking for meeting mode — rocks here may be a subset
  // focusedIdx is relative to the full filteredSortedRocks; we highlight matching rock by id
  const focusedRockId = rocks[focusedIdx]?.id;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="table-header">
            <SortTh label="Rock" sortKey="title" className="pl-4" {...thProps} />
            <SortTh label="Goal" sortKey="goal.title" {...thProps} />
            <SortTh label="Dept" sortKey="department" {...thProps} />
            <SortTh label="Owner" sortKey="owner.name" {...thProps} />
            <SortTh label="Status" sortKey="status" {...thProps} />
            <SortTh label="%" sortKey="completionPct" {...thProps} />
            <SortTh label="Conf" sortKey="confidence" {...thProps} />
            <SortTh label="Qtr" sortKey="quarter" {...thProps} />
            <SortTh label="Updated" sortKey="updatedAt" {...thProps} />
            <th className="px-3 py-2 text-left">Flags</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rocks.map((rock, idx) => {
            const isOpen = openEditorRockId === rock.id && draft;
            const isSelected = selectedRockId === rock.id;
            const isFocused = meetingMode && focusedRockId === rock.id;
            return (
              <Fragment key={rock.id}>
                <tr
                  data-row-idx={idx}
                  className={cn(
                    "table-row",
                    isSelected && "table-row-selected",
                    isFocused && "table-row-focused",
                    "cursor-pointer"
                  )}
                  onClick={(e) => {
                    // don't open detail if clicking interactive child
                    if ((e.target as HTMLElement).closest("button, a, select, input")) return;
                    onOpenDetail(rock);
                  }}
                >
                  {/* Rock title */}
                  <td className="px-4 py-1.5 max-w-[200px]">
                    <Link
                      href={`/rocks/${rock.id}`}
                      className="block truncate text-xs font-semibold text-text-primary transition-colors hover:text-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rock.title}
                    </Link>
                  </td>

                  {/* Goal */}
                  <td className="px-3 py-1.5 max-w-[160px]">
                    <span className="block truncate text-xs text-text-secondary">{rock.goal.title}</span>
                  </td>

                  {/* Dept */}
                  <td className="px-3 py-1.5">
                    <DepartmentBadge department={rock.department} />
                  </td>

                  {/* Owner */}
                  <td className="px-3 py-1.5 text-xs text-text-secondary whitespace-nowrap">
                    {rock.owner.name}
                  </td>

                  {/* Status — inline editable */}
                  <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                    {canPatchRock ? (
                      <select
                        value={rock.status}
                        onChange={(e) =>
                          onPatchRock(rock.id, { status: e.target.value })
                        }
                        className="inline-edit-select rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: `var(--tw-text-${ROCK_STATUS_CONFIG[rock.status].color.replace("text-", "")})` }}
                      >
                        {Object.entries(ROCK_STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <RockStatusBadge status={rock.status} compact />
                    )}
                  </td>

                  {/* % — inline editable */}
                  <td className="px-3 py-1.5 w-16" onClick={(e) => e.stopPropagation()}>
                    {canPatchRock ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={rock.completionPct}
                        onChange={(e) =>
                          onPatchRock(rock.id, { completionPct: Number(e.target.value) })
                        }
                        className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    ) : (
                      <span className="text-xs text-text-secondary">{formatPercent(rock.completionPct)}</span>
                    )}
                  </td>

                  {/* Confidence — inline editable */}
                  <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                    {canPatchRock ? (
                      <select
                        value={rock.confidence}
                        onChange={(e) =>
                          onPatchRock(rock.id, { confidence: e.target.value })
                        }
                        className="inline-edit-select rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      >
                        {Object.entries(CONFIDENCE_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <ConfidenceIndicator confidence={rock.confidence} />
                    )}
                  </td>

                  {/* Quarter */}
                  <td className="px-3 py-1.5 text-xs text-text-secondary">{rock.quarter}</td>

                  {/* Last update */}
                  <td className="px-3 py-1.5 text-xs text-text-secondary whitespace-nowrap">
                    {formatDate(rock.updatedAt)}
                  </td>

                  {/* Flags */}
                  <td className="px-3 py-1.5">
                    {rock.isStale && (
                      <span className="inline-block rounded-full border border-status-at-risk/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-status-at-risk">
                        Stale
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenQuickEditor(rock)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors",
                          isOpen
                            ? "border-accent/40 bg-accent text-background"
                            : "border-border bg-background text-text-secondary hover:border-border-strong hover:text-text-primary"
                        )}
                      >
                        <PlusCircleIcon className="h-3 w-3" />
                        {isOpen ? "Close" : "Update"}
                      </button>
                      <Link
                        href={`/rocks/${rock.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        Open
                      </Link>
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-background/60">
                    <td colSpan={11} className="px-4 py-3">
                      <InlineQuickUpdateForm
                        rock={rock}
                        draft={draft}
                        canPatchRock={canPatchRock}
                        submitting={submittingRockId === rock.id}
                        error={formError}
                        success={formSuccess}
                        onDraftChange={onDraftChange}
                        onSubmit={() => onSubmitQuickUpdate(rock)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Inline Quick Update Form ─────────────────────────────────────────────────

function InlineQuickUpdateForm({
  rock, draft, canPatchRock, submitting, error, success, onDraftChange, onSubmit,
}: {
  rock: RockRow; draft: MeetingDraft; canPatchRock: boolean;
  submitting: boolean; error: string; success: string;
  onDraftChange: React.Dispatch<React.SetStateAction<MeetingDraft | null>>;
  onSubmit: () => Promise<void>;
}) {
  function set<K extends keyof MeetingDraft>(field: K, value: MeetingDraft[K]) {
    onDraftChange((c) => (c ? { ...c, [field]: value } : c));
  }

  return (
    <div className="rounded-[18px] border border-border bg-background-secondary/90 p-4">
      <p className="mb-3 text-xs font-semibold text-text-primary">{rock.title} — Weekly Update</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          Week Of
          <input type="date" value={draft.weekOf} onChange={(e) => set("weekOf", e.target.value)} className="input-field py-1.5 text-xs" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          Completion %
          <input type="number" min={0} max={100} value={draft.completionPct} onChange={(e) => set("completionPct", Number(e.target.value))} className="input-field py-1.5 text-xs" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          Confidence
          <select value={draft.confidenceLevel} onChange={(e) => set("confidenceLevel", e.target.value as ConfidenceLevel)} className="input-field py-1.5 text-xs">
            {Object.entries(CONFIDENCE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          Status
          <select value={draft.status} onChange={(e) => set("status", e.target.value as RockStatusKey)} className="input-field py-1.5 text-xs" disabled={!canPatchRock}>
            {Object.entries(ROCK_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          Progress Notes <span className="text-status-off-track">*</span>
          <textarea value={draft.progressNotes} onChange={(e) => set("progressNotes", e.target.value)} className="input-field min-h-[72px] text-xs" placeholder="What moved this week?" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          Blockers
          <textarea value={draft.blockers} onChange={(e) => set("blockers", e.target.value)} className="input-field min-h-[72px] text-xs" placeholder="Current blockers" />
        </label>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={draft.needsAttention} onChange={(e) => set("needsAttention", e.target.checked)} className="h-3.5 w-3.5" />
            Flag for attention
          </label>
          <button type="button" onClick={onSubmit} disabled={submitting} className="btn-primary px-4 py-2 text-xs">
            {submitting ? "Saving…" : "Save Update"}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-status-off-track">{error}</p>}
      {success && <p className="mt-2 text-xs text-status-on-track">{success}</p>}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  rockId, detail, loading, note, noteSubmitting, noteError, canPatchRock,
  onNoteChange, onNoteSubmit, onPatch, onClose,
}: {
  rockId: string; detail: RockDetail | null; loading: boolean;
  note: string; noteSubmitting: boolean; noteError: string; canPatchRock: boolean;
  onNoteChange: (v: string) => void; onNoteSubmit: () => void;
  onPatch: (id: string, data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="w-[360px] shrink-0 rounded-[22px] border border-border bg-background-secondary/95 flex flex-col" style={{ maxHeight: "calc(100vh - 8rem)", position: "sticky", top: "1rem" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          {loading ? (
            <div className="h-3 w-40 animate-pulse rounded bg-background-tertiary" />
          ) : detail ? (
            <>
              <p className="truncate text-xs font-semibold text-text-primary">{detail.title}</p>
              <p className="mt-0.5 truncate text-[10px] text-text-tertiary">{detail.goal.title}</p>
            </>
          ) : (
            <p className="text-xs text-text-tertiary">Loading…</p>
          )}
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full p-1 text-text-tertiary transition-colors hover:text-text-primary">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {detail && !loading ? (
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-border px-4 py-3 text-[10px]">
            <MetaRow label="Status">
              <RockStatusBadge status={detail.status} compact />
            </MetaRow>
            <MetaRow label="Confidence">
              <ConfidenceIndicator confidence={detail.confidence} />
            </MetaRow>
            <MetaRow label="Completion">
              <span className="text-xs font-semibold text-text-primary">{formatPercent(detail.completionPct)}</span>
            </MetaRow>
            <MetaRow label="Owner">
              <span className="text-xs text-text-secondary">{detail.owner.name}</span>
            </MetaRow>
            <MetaRow label="Quarter">
              <span className="text-xs text-text-secondary">{detail.quarter}</span>
            </MetaRow>
            <MetaRow label="Dept">
              <DepartmentBadge department={detail.department} />
            </MetaRow>
            {detail.blockers && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">Blockers</p>
                <p className="mt-0.5 text-xs text-status-at-risk">{detail.blockers}</p>
              </div>
            )}
          </div>

          {/* Quick note */}
          <div className="border-b border-border px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">Quick Note</p>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a progress note for this week…"
              rows={3}
              className="input-field text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onNoteSubmit();
                }
              }}
            />
            {noteError && <p className="mt-1 text-[10px] text-status-off-track">{noteError}</p>}
            <button
              type="button"
              onClick={onNoteSubmit}
              disabled={noteSubmitting || !note.trim()}
              className="btn-primary mt-2 w-full py-1.5 text-xs"
            >
              {noteSubmitting ? "Saving…" : "Save Note (⌘Enter)"}
            </button>
          </div>

          {/* Update history */}
          <div className="flex-1 px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
              Update History ({detail.weeklyUpdates.length})
            </p>
            {detail.weeklyUpdates.length === 0 ? (
              <p className="text-xs text-text-tertiary">No updates yet.</p>
            ) : (
              <div className="space-y-3">
                {detail.weeklyUpdates.map((u) => (
                  <div key={u.id} className="rounded-[14px] border border-border bg-background/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-text-secondary">{formatDate(u.weekOf)}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", CONFIDENCE_CONFIG[u.confidenceLevel]?.color ?? "text-text-tertiary")}>
                          {u.confidenceLevel}
                        </span>
                        <span className="text-[10px] text-text-tertiary">{formatPercent(u.completionPct)}</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-text-secondary">{u.progressNotes}</p>
                    {u.blockers && (
                      <p className="mt-1 text-[10px] text-status-at-risk">⚠ {u.blockers}</p>
                    )}
                    <p className="mt-1 text-[10px] text-text-tertiary">— {u.author.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-1 flex-col gap-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-background-tertiary" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
