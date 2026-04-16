"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { GoalStatusBadge } from "@/components/shared/status-badge";
import {
  DEPARTMENT_CONFIG,
  DEPARTMENT_ORDER,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from "@/lib/constants";
import { cn, formatDate, formatPercent } from "@/lib/utils";

type DepartmentKey = keyof typeof DEPARTMENT_CONFIG;
type SortDir = "asc" | "desc";
type Confidence = "HIGH" | "MEDIUM" | "LOW";

interface GoalRow {
  id: string;
  title: string;
  description: string;
  department: DepartmentKey;
  status: keyof typeof STATUS_CONFIG;
  priority: keyof typeof PRIORITY_CONFIG;
  completionPct: number;
  targetDate: Date | string;
  updatedAt?: Date | string;
  owner: { name: string };
  _count: { rocks: number };
}

interface LoadedRock {
  id: string;
  title: string;
  quarter: string;
  status: string;
  completionPct: number;
  confidence: Confidence;
  owner: { id: string; name: string };
}

type DepartmentFilter = "ALL" | DepartmentKey;
type GroupMode = "DEPT" | "FLAT";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function getField(goal: GoalRow, key: string): string | number | Date {
  switch (key) {
    case "owner.name": return goal.owner.name;
    case "updatedAt": return goal.updatedAt ? new Date(goal.updatedAt) : new Date(0);
    case "targetDate": return new Date(goal.targetDate);
    case "completionPct": return goal.completionPct;
    case "_count.rocks": return goal._count.rocks;
    case "department": return DEPARTMENT_ORDER.indexOf(goal.department);
    default: return (goal as unknown as Record<string, string | number>)[key] ?? "";
  }
}

function sortGoals(goals: GoalRow[], key: string, dir: SortDir): GoalRow[] {
  return [...goals].sort((a, b) => {
    const av = getField(a, key);
    const bv = getField(b, key);
    let cmp = 0;
    if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
    else if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });
}

function exportCSV(goals: GoalRow[]) {
  const headers = ["Title", "Dept", "Owner", "Status", "Priority", "%", "Rocks", "Target"];
  const rows = goals.map((g) => [
    g.title, g.department, g.owner.name, g.status, g.priority,
    g.completionPct, g._count.rocks, formatDate(g.targetDate),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `goals-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Rock update row ──────────────────────────────────────────────────────────

const CONF_CYCLE: Confidence[] = ["HIGH", "MEDIUM", "LOW"];
const CONF_LABEL: Record<Confidence, string> = { HIGH: "On Track", MEDIUM: "At Risk", LOW: "Off Track" };
const CONF_CLS: Record<Confidence, string> = {
  HIGH:   "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  MEDIUM: "border-amber-500/40  bg-amber-500/10  text-amber-500",
  LOW:    "border-red-500/40    bg-red-500/10    text-red-500",
};

function RockUpdateRow({ rock }: { rock: LoadedRock }) {
  const [pct, setPct]         = useState(rock.completionPct);
  const [conf, setConf]       = useState<Confidence>(rock.confidence ?? "HIGH");
  const [notes, setNotes]     = useState("");
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(overridePct?: number, overrideConf?: Confidence) {
    if (saving) return;
    setSaving(true);
    const body = {
      completionPct: overridePct ?? pct,
      confidenceLevel: overrideConf ?? conf,
      progressNotes: notes.trim() || "-",
      needsAttention: (overrideConf ?? conf) === "LOW",
    };

    try {
      let id = updateId;
      if (id) {
        await fetch(`/api/rocks/${rock.id}/updates/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const res = await fetch(`/api/rocks/${rock.id}/updates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, weekOf: getMonday() }),
        });
        if (res.status === 201) {
          const data = await res.json();
          id = data.id;
        } else {
          // Conflict — find existing week update and PUT
          const all = await fetch(`/api/rocks/${rock.id}/updates`).then((r) => r.json());
          const mon = getMonday();
          const existing = (all as { id: string; weekOf: string }[]).find((u) =>
            u.weekOf.startsWith(mon)
          );
          if (existing) {
            id = existing.id;
            await fetch(`/api/rocks/${rock.id}/updates/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
          }
        }
        if (id) setUpdateId(id);
      }
      setSaved(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function cycleConf() {
    const next = CONF_CYCLE[(CONF_CYCLE.indexOf(conf) + 1) % 3];
    setConf(next);
    save(undefined, next);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); save(); }
  }

  const monday = getMonday();
  const dateLabel = new Date(monday + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <tr className="border-b border-border/40 hover:bg-background-tertiary/20">
      <td className="py-1.5 pl-10 pr-3 max-w-[200px]">
        <Link
          href={`/rocks/${rock.id}`}
          className="block truncate text-xs font-medium text-text-primary hover:text-accent"
        >
          {rock.title}
        </Link>
      </td>
      <td className="px-3 py-1.5 text-xs text-text-tertiary whitespace-nowrap">{rock.owner.name}</td>
      <td className="px-3 py-1.5 text-[11px] font-semibold text-text-tertiary">{rock.quarter}</td>
      <td className="px-3 py-1.5">
        <select
          value={conf}
          onChange={(e) => setConf(e.target.value as Confidence)}
          onBlur={() => save()}
          className="h-8 rounded border border-border bg-background px-2 text-xs text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </td>
      <td className="px-3 py-1.5">
        <button
          type="button"
          onClick={cycleConf}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
            CONF_CLS[conf]
          )}
        >
          {CONF_LABEL[conf]}
        </button>
      </td>
      <td className="px-3 py-1.5">
        <input
          type="number"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          onBlur={() => save()}
          onKeyDown={handleKey}
          className="h-8 w-14 rounded border border-border bg-background px-2 text-xs text-text-primary focus:border-accent focus:outline-none"
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => save()}
          onKeyDown={handleKey}
          placeholder="Notes…"
          className="h-8 w-48 rounded border border-border bg-background px-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      </td>
      <td className="px-3 py-1.5 text-[11px] text-text-tertiary whitespace-nowrap">{dateLabel}</td>
      <td className="w-6 px-2 py-1.5 text-center">
        {saving && <span className="text-[10px] text-text-tertiary animate-pulse">…</span>}
        {!saving && saved && <span className="text-[10px] text-emerald-500">✓</span>}
      </td>
    </tr>
  );
}

// ─── Rock update table (lazy-loaded) ─────────────────────────────────────────

function RockUpdateTable({ goalId }: { goalId: string }) {
  const [rocks, setRocks] = useState<LoadedRock[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/goals/${goalId}`)
      .then((r) => r.json())
      .then((data) => {
        const sorted: LoadedRock[] = [...(data.rocks ?? [])].sort((a, b) =>
          a.quarter.localeCompare(b.quarter)
        );
        setRocks(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [goalId]);

  if (loading) {
    return (
      <div className="py-2 pl-10 text-xs text-text-tertiary">Loading rocks…</div>
    );
  }
  if (!rocks?.length) {
    return (
      <div className="py-2 pl-10 text-xs text-text-tertiary">No rocks linked.</div>
    );
  }

  return (
    <div className="border-t border-border/60 bg-background-secondary/40">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border/40">
            <th className="py-1 pl-10 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Rock</th>
            <th className="px-3 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Owner</th>
            <th className="px-3 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Qtr</th>
            <th className="px-3 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Confidence</th>
            <th className="px-3 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Status</th>
            <th className="px-3 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">%</th>
            <th className="px-3 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Notes</th>
            <th className="px-3 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Date</th>
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {rocks.map((rock) => (
            <RockUpdateRow key={rock.id} rock={rock} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Goals Table ──────────────────────────────────────────────────────────────

function GoalsTable({
  goals, currentKey, currentDir, onSort, expandedGoals, onToggleGoal,
}: {
  goals: GoalRow[];
  currentKey: string;
  currentDir: SortDir;
  onSort: (k: string) => void;
  expandedGoals: Set<string>;
  onToggleGoal: (id: string) => void;
}) {
  const thProps = { currentKey, currentDir, onSort };
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="table-header">
            <SortTh label="Goal" sortKey="title" className="pl-4" {...thProps} />
            <SortTh label="Dept" sortKey="department" {...thProps} />
            <SortTh label="Owner" sortKey="owner.name" {...thProps} />
            <SortTh label="Status" sortKey="status" {...thProps} />
            <SortTh label="Priority" sortKey="priority" {...thProps} />
            <SortTh label="%" sortKey="completionPct" {...thProps} />
            <SortTh label="Rocks" sortKey="_count.rocks" {...thProps} />
            <SortTh label="Target" sortKey="targetDate" {...thProps} />
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => {
            const isExpanded = expandedGoals.has(goal.id);
            return (
              <Fragment key={goal.id}>
                <tr className="table-row">
                  <td className="px-4 py-1.5 max-w-[220px]">
                    <div className="flex items-center gap-1">
                      {goal._count.rocks > 0 ? (
                        <button
                          type="button"
                          onClick={() => onToggleGoal(goal.id)}
                          className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
                        >
                          <ChevronRightIcon
                            className={cn(
                              "h-3.5 w-3.5 transition-transform duration-150",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </button>
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <Link
                        href={`/goals/${goal.id}`}
                        className="block truncate text-xs font-semibold text-text-primary transition-colors hover:text-accent"
                      >
                        {goal.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <DepartmentBadge department={goal.department} />
                  </td>
                  <td className="px-3 py-1.5 text-xs text-text-secondary whitespace-nowrap">
                    {goal.owner.name}
                  </td>
                  <td className="px-3 py-1.5">
                    <GoalStatusBadge status={goal.status} compact />
                  </td>
                  <td className="px-3 py-1.5">
                    <PriorityBadge priority={goal.priority} />
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="text-xs text-text-secondary">{formatPercent(goal.completionPct)}</span>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-text-secondary">{goal._count.rocks}</td>
                  <td className="px-3 py-1.5 text-xs text-text-secondary whitespace-nowrap">
                    {formatDate(goal.targetDate)}
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/goals/${goal.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        Open
                      </Link>
                      <Link
                        href={`/goals/${goal.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                      >
                        <PencilSquareIcon className="h-3 w-3" />
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <RockUpdateTable goalId={goal.id} />
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

// ─── Main workspace ───────────────────────────────────────────────────────────

export function GoalsWorkspace({ goals }: { goals: GoalRow[] }) {
  const [deptFilter, setDeptFilter]     = useState<DepartmentFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [groupMode, setGroupMode]       = useState<GroupMode>("DEPT");
  const [sortKey, setSortKey]           = useState<string>("department");
  const [sortDir, setSortDir]           = useState<SortDir>("asc");
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  function toggleGoal(id: string) {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filteredSorted = useMemo(() => {
    const filtered = goals.filter((g) => {
      if (deptFilter !== "ALL" && g.department !== deptFilter) return false;
      if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && g.priority !== priorityFilter) return false;
      return true;
    });
    return sortGoals(filtered, sortKey, sortDir);
  }, [goals, deptFilter, statusFilter, priorityFilter, sortKey, sortDir]);

  const groupedByDept = useMemo(
    () =>
      DEPARTMENT_ORDER.map((dept) => ({
        key: dept,
        label: DEPARTMENT_CONFIG[dept].label,
        items: filteredSorted.filter((g) => g.department === dept),
      })).filter((g) => g.items.length > 0),
    [filteredSorted]
  );

  function handleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const tableProps = {
    currentKey: sortKey,
    currentDir: sortDir,
    onSort: handleSort,
    expandedGoals,
    onToggleGoal: toggleGoal,
  };

  return (
    <div className="space-y-3">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background-secondary/80 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <DeptChip label="All" active={deptFilter === "ALL"} onClick={() => setDeptFilter("ALL")} />
          {DEPARTMENT_ORDER.map((d) => (
            <DeptChip
              key={d}
              label={DEPARTMENT_CONFIG[d].shortLabel}
              active={deptFilter === d}
              onClick={() => setDeptFilter(d)}
            />
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "ALL", label: "All Status" },
            ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />

        <FilterSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "ALL", label: "All Priority" },
            ...Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />

        <FilterSelect
          value={groupMode}
          onChange={(v) => setGroupMode(v as GroupMode)}
          options={[
            { value: "DEPT", label: "By Dept" },
            { value: "FLAT", label: "Flat" },
          ]}
        />

        <div className="h-4 w-px bg-border" />

        <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
          {filteredSorted.length} goals
        </span>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => exportCSV(filteredSorted)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {groupMode === "DEPT" ? (
        <div className="space-y-3">
          {groupedByDept.map((group) => (
            <section key={group.key} className="table-shell">
              <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
                <span className="text-xs font-semibold text-text-primary">{group.label}</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">{group.items.length} goals</span>
              </div>
              <GoalsTable goals={group.items} {...tableProps} />
            </section>
          ))}
        </div>
      ) : (
        <div className="table-shell">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-semibold text-text-primary">All Goals</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">{filteredSorted.length} goals</span>
          </div>
          <GoalsTable goals={filteredSorted} {...tableProps} />
        </div>
      )}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
          currentDir === "asc" ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
        ) : null}
      </span>
    </th>
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
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
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
