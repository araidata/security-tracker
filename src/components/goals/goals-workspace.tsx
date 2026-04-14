"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowTopRightOnSquareIcon, ArrowUpIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
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

type DepartmentFilter = "ALL" | DepartmentKey;
type GroupMode = "DEPT" | "FLAT";

// ─── Sort helpers ─────────────────────────────────────────────────────────────

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

function exportCSV(goals: GoalRow[]) {
  const headers = ["Title", "Dept", "Owner", "Status", "Priority", "%", "Rocks", "Target"];
  const rows = goals.map((g) => [
    g.title,
    g.department,
    g.owner.name,
    g.status,
    g.priority,
    g.completionPct,
    g._count.rocks,
    formatDate(g.targetDate),
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

// ─── Main workspace ───────────────────────────────────────────────────────────

export function GoalsWorkspace({ goals }: { goals: GoalRow[] }) {
  const [deptFilter, setDeptFilter] = useState<DepartmentFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [groupMode, setGroupMode] = useState<GroupMode>("DEPT");
  const [sortKey, setSortKey] = useState<string>("department");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  const thProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <div className="space-y-3">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background-secondary/80 px-3 py-2.5">
        {/* Dept chips */}
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

        {/* Status */}
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "ALL", label: "All Status" },
            ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />

        {/* Priority */}
        <FilterSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "ALL", label: "All Priority" },
            ...Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />

        {/* Group */}
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
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-xs font-semibold text-text-primary">{group.label}</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">{group.items.length} goals</span>
              </div>
              <GoalsTable goals={group.items} {...thProps} />
            </section>
          ))}
        </div>
      ) : (
        <div className="table-shell">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-semibold text-text-primary">All Goals</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">{filteredSorted.length} goals</span>
          </div>
          <GoalsTable goals={filteredSorted} {...thProps} />
        </div>
      )}
    </div>
  );
}

// ─── Goals Table ──────────────────────────────────────────────────────────────

function GoalsTable({
  goals, currentKey, currentDir, onSort,
}: {
  goals: GoalRow[];
  currentKey: string; currentDir: SortDir; onSort: (k: string) => void;
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
          {goals.map((goal) => (
            <tr key={goal.id} className="table-row">
              <td className="px-4 py-1.5 max-w-[220px]">
                <Link
                  href={`/goals/${goal.id}`}
                  className="block truncate text-xs font-semibold text-text-primary transition-colors hover:text-accent"
                >
                  {goal.title}
                </Link>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

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
