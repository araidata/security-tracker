"use client";

import { useMemo, useState } from "react";
import { DEPARTMENT_CONFIG, ROCK_STATUS_CONFIG } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

type DeptKey = "SEC_OPS" | "SAE" | "GRC";
const NON_ADMIN_DEPTS: DeptKey[] = ["SEC_OPS", "SAE", "GRC"];
const DEPT_IDX: Record<string, number> = { SEC_OPS: 0, SAE: 1, GRC: 2 };

export interface ExportGoal {
  id: string;
  title: string;
  department: string;
  status: string;
  completionPct: number;
}

export interface ExportRock {
  id: string;
  goalId: string;
  title: string;
  status: string;
  completionPct: number;
  quarter: string;
  department: string;
  owner: { name: string };
}

export interface ExportUpdate {
  id: string;
  rockId: string;
  weekOf: string;
  progressNotes: string;
  blockers?: string | null;
  needsAttention: boolean;
  completionPct: number;
}

// Monday of the current ISO week at 00:00:00 local time
function startOfThisWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildReport(
  goals: ExportGoal[],
  rocks: ExportRock[],
  updatesByRock: Map<string, ExportUpdate[]>,
  latestOnly: boolean
): string {
  const rocksByGoal = new Map<string, ExportRock[]>();
  for (const rock of rocks) {
    const arr = rocksByGoal.get(rock.goalId) ?? [];
    arr.push(rock);
    rocksByGoal.set(rock.goalId, arr);
  }

  const lines: string[] = [];

  for (const goal of goals) {
    const goalRocks = rocksByGoal.get(goal.id);
    if (!goalRocks?.length) continue;

    const deptLabel =
      DEPARTMENT_CONFIG[goal.department as DeptKey]?.label ?? goal.department;

    lines.push("═".repeat(60));
    lines.push(`GOAL: ${goal.title}`);
    lines.push(`Dept: ${deptLabel} | ${formatPercent(goal.completionPct)} Complete`);
    lines.push("═".repeat(60));
    lines.push("");

    for (const rock of goalRocks) {
      const statusLabel =
        ROCK_STATUS_CONFIG[rock.status as keyof typeof ROCK_STATUS_CONFIG]?.label ??
        rock.status;

      lines.push(`  ROCK: ${rock.title} (${rock.quarter})`);
      lines.push(
        `  Status: ${statusLabel} | ${formatPercent(rock.completionPct)} | Owner: ${rock.owner.name}`
      );

      const all = updatesByRock.get(rock.id) ?? [];
      const shown = latestOnly ? all.slice(0, 1) : all;

      if (shown.length === 0) {
        lines.push("  Updates: None");
      } else {
        for (const upd of shown) {
          lines.push(`  Updated: ${fmt(upd.weekOf)}`);
          lines.push("  Progress:");
          lines.push(`    ${upd.progressNotes}`);
          if (upd.blockers) {
            lines.push("  Blockers:");
            lines.push(`    ${upd.blockers}`);
          }
          if (upd.needsAttention) {
            lines.push("  !! Needs Attention");
          }
        }
      }

      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportContent({
  goals,
  rocks,
  updates,
}: {
  goals: ExportGoal[];
  rocks: ExportRock[];
  updates: ExportUpdate[];
}) {
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedGoalId, setSelectedGoalId] = useState("ALL");
  const [selectedRockId, setSelectedRockId] = useState("ALL");
  const [timeRange, setTimeRange] = useState<"this_week" | "last_N" | "all">("all");
  const [nWeeks, setNWeeks] = useState(4);
  const [latestOnly, setLatestOnly] = useState(true);
  const [copied, setCopied] = useState(false);

  // Dept-filtered goals (for goal dropdown options)
  const deptGoals = useMemo(
    () =>
      goals.filter((g) => selectedDept === "ALL" || g.department === selectedDept),
    [goals, selectedDept]
  );

  // Goals after goal filter applied
  const finalGoals = useMemo(
    () =>
      selectedGoalId === "ALL"
        ? deptGoals
        : deptGoals.filter((g) => g.id === selectedGoalId),
    [deptGoals, selectedGoalId]
  );

  const finalGoalIds = useMemo(
    () => new Set(finalGoals.map((g) => g.id)),
    [finalGoals]
  );

  // Rocks for goal dropdown (all under dept-filtered goals)
  const rockOptions = useMemo(
    () => rocks.filter((r) => finalGoalIds.has(r.goalId)),
    [rocks, finalGoalIds]
  );

  // Final rocks (after rock filter)
  const finalRocks = useMemo(
    () =>
      rockOptions.filter(
        (r) => selectedRockId === "ALL" || r.id === selectedRockId
      ),
    [rockOptions, selectedRockId]
  );

  const finalRockIds = useMemo(
    () => new Set(finalRocks.map((r) => r.id)),
    [finalRocks]
  );

  const cutoff = useMemo((): Date | null => {
    if (timeRange === "this_week") return startOfThisWeek();
    if (timeRange === "last_N") {
      const d = new Date();
      d.setDate(d.getDate() - nWeeks * 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return null;
  }, [timeRange, nWeeks]);

  // Build updatesByRock map (already sorted weekOf DESC, createdAt DESC from server)
  const updatesByRock = useMemo(() => {
    const map = new Map<string, ExportUpdate[]>();
    for (const upd of updates) {
      if (!finalRockIds.has(upd.rockId)) continue;
      if (cutoff && new Date(upd.weekOf) < cutoff) continue;
      const arr = map.get(upd.rockId) ?? [];
      arr.push(upd);
      map.set(upd.rockId, arr);
    }
    return map;
  }, [updates, finalRockIds, cutoff]);

  const report = useMemo(
    () => buildReport(finalGoals, finalRocks, updatesByRock, latestOnly),
    [finalGoals, finalRocks, updatesByRock, latestOnly]
  );

  function handleDeptChange(v: string) {
    setSelectedDept(v);
    setSelectedGoalId("ALL");
    setSelectedRockId("ALL");
  }

  function handleGoalChange(v: string) {
    setSelectedGoalId(v);
    setSelectedRockId("ALL");
  }

  function handleCopy() {
    if (!report) return;
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!report) return;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls =
    "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none";

  return (
    <div className="flex gap-5 min-h-[calc(100vh-12rem)]">
      {/* ── Filters ── */}
      <aside className="w-52 shrink-0 space-y-4">
        <Field label="Department">
          <select
            value={selectedDept}
            onChange={(e) => handleDeptChange(e.target.value)}
            className={selectCls}
          >
            <option value="ALL">All Departments</option>
            {NON_ADMIN_DEPTS.map((d) => (
              <option key={d} value={d}>
                {DEPARTMENT_CONFIG[d].label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Goal">
          <select
            value={selectedGoalId}
            onChange={(e) => handleGoalChange(e.target.value)}
            className={selectCls}
          >
            <option value="ALL">All Goals</option>
            {deptGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rock">
          <select
            value={selectedRockId}
            onChange={(e) => setSelectedRockId(e.target.value)}
            className={selectCls}
          >
            <option value="ALL">All Rocks</option>
            {rockOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Time Range">
          <select
            value={timeRange}
            onChange={(e) =>
              setTimeRange(e.target.value as typeof timeRange)
            }
            className={selectCls}
          >
            <option value="this_week">This Week</option>
            <option value="last_N">Last N Weeks</option>
            <option value="all">All Time</option>
          </select>
          {timeRange === "last_N" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={52}
                value={nWeeks}
                onChange={(e) =>
                  setNWeeks(
                    Math.max(1, Math.min(52, Number(e.target.value)))
                  )
                }
                className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
              <span className="text-xs text-text-tertiary">weeks</span>
            </div>
          )}
        </Field>

        <Field label="Updates">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
            <input
              type="radio"
              name="updateMode"
              checked={latestOnly}
              onChange={() => setLatestOnly(true)}
              className="h-3.5 w-3.5"
            />
            Latest only
          </label>
          <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
            <input
              type="radio"
              name="updateMode"
              checked={!latestOnly}
              onChange={() => setLatestOnly(false)}
              className="h-3.5 w-3.5"
            />
            All updates
          </label>
        </Field>
      </aside>

      {/* ── Preview ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            {finalRocks.length} rock{finalRocks.length !== 1 ? "s" : ""} across{" "}
            {finalGoals.length} goal{finalGoals.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!report}
              className="btn-secondary px-3 text-xs disabled:opacity-40"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!report}
              className="btn-secondary px-3 text-xs disabled:opacity-40"
            >
              Download .txt
            </button>
          </div>
        </div>

        <textarea
          readOnly
          value={report || "No data matches the selected filters."}
          className="flex-1 resize-none rounded-lg border border-border bg-background-secondary/40 p-4 font-mono text-xs leading-5 text-text-secondary focus:outline-none"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      {children}
    </div>
  );
}
