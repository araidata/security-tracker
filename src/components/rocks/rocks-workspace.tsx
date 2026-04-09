"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Fragment, useMemo, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { RockStatusBadge } from "@/components/shared/status-badge";
import {
  DEPARTMENT_CONFIG,
  DEPARTMENT_ORDER,
  ROCK_STATUS_CONFIG,
} from "@/lib/constants";
import { formatDate, formatPercent } from "@/lib/utils";

type DepartmentKey = keyof typeof DEPARTMENT_CONFIG;
type RockStatusKey = keyof typeof ROCK_STATUS_CONFIG;
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
type DensityMode = "DETAILED" | "CONDENSED";
type OrganizationMode = "GROUPED" | "ALL";
type DepartmentFilter = "ALL" | DepartmentKey;

interface RockRow {
  id: string;
  title: string;
  goal: { id: string; title: string };
  quarter: string;
  department: DepartmentKey;
  status: RockStatusKey;
  confidence: ConfidenceLevel;
  completionPct: number;
  owner: { name: string };
  targetDate: Date | string;
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

export function RocksWorkspace({ rocks }: { rocks: RockRow[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [density, setDensity] = useState<DensityMode>("CONDENSED");
  const [organization, setOrganization] = useState<OrganizationMode>("GROUPED");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("ALL");
  const [openEditorRockId, setOpenEditorRockId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MeetingDraft | null>(null);
  const [submittingRockId, setSubmittingRockId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");

  const canPatchRock = session?.user?.role === "EXECUTIVE" || session?.user?.role === "MANAGER";

  const filteredRocks = useMemo(
    () =>
      rocks
        .filter((rock) => departmentFilter === "ALL" || rock.department === departmentFilter)
        .sort((a, b) => {
          const departmentDelta =
            DEPARTMENT_ORDER.indexOf(a.department) - DEPARTMENT_ORDER.indexOf(b.department);
          if (departmentDelta !== 0) return departmentDelta;
          return a.title.localeCompare(b.title);
        }),
    [departmentFilter, rocks]
  );

  const groupedRocks = useMemo(
    () =>
      DEPARTMENT_ORDER.map((department) => ({
        department,
        items: filteredRocks.filter((rock) => rock.department === department),
      })).filter((group) => group.items.length > 0),
    [filteredRocks]
  );

  const isCondensed = density === "CONDENSED";
  const showGrouped = organization === "GROUPED";

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
      blockers: rock.blockers || "",
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
        const patchResponse = await fetch(`/api/rocks/${rock.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: draft.status,
            completionPct: draft.completionPct,
            confidence: draft.confidenceLevel,
            blockers: draft.blockers || undefined,
          }),
        });

        if (!patchResponse.ok) {
          throw new Error("Unable to update rock status.");
        }
      }

      const updateResponse = await fetch(`/api/rocks/${rock.id}/updates`, {
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

      if (!updateResponse.ok) {
        const errorPayload = await updateResponse.json().catch(() => null);
        throw new Error(
          typeof errorPayload?.error === "string"
            ? errorPayload.error
            : "Unable to submit weekly update."
        );
      }

      setFormSuccess("Update captured. Refreshing meeting sheet...");
      setOpenEditorRockId(null);
      setDraft(null);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmittingRockId(null);
    }
  }

  return (
    <div className="space-y-4">
      <WorkspaceControls
        density={density}
        organization={organization}
        departmentFilter={departmentFilter}
        canPatchRock={canPatchRock}
        onDensityChange={setDensity}
        onOrganizationChange={setOrganization}
        onDepartmentFilterChange={(value) => setDepartmentFilter(value as DepartmentFilter)}
      />

      {showGrouped ? (
        <div className="space-y-4">
          {groupedRocks.map((group) => (
            <section key={group.department} className="table-shell">
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">{DEPARTMENT_CONFIG[group.department].label}</p>
                  <h2 className="mt-2 text-xl font-semibold text-text-primary">
                    {group.items.length} rocks in this department
                  </h2>
                </div>
                <div className="text-xs uppercase tracking-[0.16em] text-text-tertiary">
                  Quick update grid
                </div>
              </div>
              <RocksTable
                rocks={group.items}
                condensed={isCondensed}
                canPatchRock={canPatchRock}
                openEditorRockId={openEditorRockId}
                draft={draft}
                submittingRockId={submittingRockId}
                formError={formError}
                formSuccess={formSuccess}
                onOpenQuickEditor={openQuickEditor}
                onDraftChange={setDraft}
                onSubmitQuickUpdate={submitQuickUpdate}
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="table-shell">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">All Departments</p>
              <h2 className="mt-2 text-xl font-semibold text-text-primary">
                Cross-functional rock list
              </h2>
            </div>
            <div className="text-xs uppercase tracking-[0.16em] text-text-tertiary">
              {filteredRocks.length} rocks shown
            </div>
          </div>
          <RocksTable
            rocks={filteredRocks}
            condensed={isCondensed}
            canPatchRock={canPatchRock}
            openEditorRockId={openEditorRockId}
            draft={draft}
            submittingRockId={submittingRockId}
            formError={formError}
            formSuccess={formSuccess}
            onOpenQuickEditor={openQuickEditor}
            onDraftChange={setDraft}
            onSubmitQuickUpdate={submitQuickUpdate}
          />
        </div>
      )}
    </div>
  );
}

function WorkspaceControls({
  density,
  organization,
  departmentFilter,
  canPatchRock,
  onDensityChange,
  onOrganizationChange,
  onDepartmentFilterChange,
}: {
  density: DensityMode;
  organization: OrganizationMode;
  departmentFilter: DepartmentFilter;
  canPatchRock: boolean;
  onDensityChange: (value: DensityMode) => void;
  onOrganizationChange: (value: OrganizationMode) => void;
  onDepartmentFilterChange: (value: string) => void;
}) {
  return (
    <div className="card flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex-1">
        <p className="eyebrow">Meeting Mode</p>
        <p className="mt-2 text-sm text-text-secondary">
          Filter directly by department, or keep everything visible in a department-sorted sheet with inline updates.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
          {canPatchRock
            ? "You can update status, confidence, completion, and weekly notes inline."
            : "You can submit weekly notes inline. Status edits stay manager/executive-only."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <DepartmentChip
            label="All Departments"
            active={departmentFilter === "ALL"}
            onClick={() => onDepartmentFilterChange("ALL")}
          />
          {DEPARTMENT_ORDER.map((department) => (
            <DepartmentChip
              key={department}
              label={DEPARTMENT_CONFIG[department].label}
              active={departmentFilter === department}
              onClick={() => onDepartmentFilterChange(department)}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ToggleGroup
          label="Department View"
          value={organization}
          options={[
            { label: "Grouped by Dept", value: "GROUPED" },
            { label: "Single Sheet", value: "ALL" },
          ]}
          onChange={(value) => onOrganizationChange(value as OrganizationMode)}
        />
        <ToggleGroup
          label="Density"
          value={density}
          options={[
            { label: "Condensed", value: "CONDENSED" },
            { label: "Detailed", value: "DETAILED" },
          ]}
          onChange={(value) => onDensityChange(value as DensityMode)}
        />
        <div className="flex min-w-[12rem] flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
          Department Filter
          <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium normal-case tracking-normal text-text-primary">
            {departmentFilter === "ALL"
              ? "Showing all departments"
              : `Filtered to ${DEPARTMENT_CONFIG[departmentFilter].label}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function RocksTable({
  rocks,
  condensed,
  canPatchRock,
  openEditorRockId,
  draft,
  submittingRockId,
  formError,
  formSuccess,
  onOpenQuickEditor,
  onDraftChange,
  onSubmitQuickUpdate,
}: {
  rocks: RockRow[];
  condensed: boolean;
  canPatchRock: boolean;
  openEditorRockId: string | null;
  draft: MeetingDraft | null;
  submittingRockId: string | null;
  formError: string;
  formSuccess: string;
  onOpenQuickEditor: (rock: RockRow) => void;
  onDraftChange: React.Dispatch<React.SetStateAction<MeetingDraft | null>>;
  onSubmitQuickUpdate: (rock: RockRow) => Promise<void>;
}) {
  const colSpan = 10;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="table-header">
            <th className={condensed ? "px-4 py-3 text-left" : "px-5 py-4 text-left"}>Rock</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Goal</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Dept</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Status</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Confidence</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Progress</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Updates</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Owner</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Target</th>
            <th className={condensed ? "px-4 py-3 text-left" : "px-5 py-4 text-left"}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rocks.map((rock) => {
            const isOpen = openEditorRockId === rock.id && draft;
            return (
              <Fragment key={rock.id}>
                <tr className="table-row align-top">
                  <td className={condensed ? "px-4 py-3" : "px-5 py-5"}>
                    <Link href={`/rocks/${rock.id}`} className="text-sm font-semibold text-text-primary transition-colors hover:text-accent">
                      {rock.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                      <span>{rock.quarter}</span>
                      {rock.isStale && (
                        <span className="rounded-full border border-status-at-risk/30 bg-status-at-risk px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-status-at-risk">
                          Stale
                        </span>
                      )}
                    </div>
                    {!condensed && rock.kpiMetric && (
                      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                        KPI: {rock.kpiMetric}
                      </p>
                    )}
                  </td>
                  <td className={condensed ? "px-3 py-3 text-sm text-text-secondary" : "px-4 py-5 text-sm text-text-secondary"}>
                    {rock.goal.title}
                  </td>
                  <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                    <DepartmentBadge department={rock.department} />
                  </td>
                  <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                    <RockStatusBadge status={rock.status} />
                  </td>
                  <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                    <ConfidenceIndicator confidence={rock.confidence} />
                  </td>
                  <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                    <div className={condensed ? "w-28" : "w-36"}>
                      <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
                        <span>{formatPercent(rock.completionPct)}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-bar" style={{ width: `${Math.min(rock.completionPct, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={condensed ? "px-3 py-3 text-sm text-text-secondary" : "px-4 py-5 text-sm text-text-secondary"}>
                    {rock._count.weeklyUpdates}
                  </td>
                  <td className={condensed ? "px-3 py-3 text-sm text-text-secondary" : "px-4 py-5 text-sm text-text-secondary"}>
                    {rock.owner.name}
                  </td>
                  <td className={condensed ? "px-3 py-3 text-sm text-text-secondary" : "px-4 py-5 text-sm text-text-secondary"}>
                    {formatDate(rock.targetDate)}
                  </td>
                  <td className={condensed ? "px-4 py-3" : "px-5 py-5"}>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenQuickEditor(rock)}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        <PlusCircleIcon className="mr-1.5 h-3.5 w-3.5" />
                        {isOpen ? "Close" : "Quick Update"}
                      </button>
                      <Link href={`/rocks/${rock.id}`} className="btn-secondary px-3 py-2 text-xs">
                        <ArrowTopRightOnSquareIcon className="mr-1.5 h-3.5 w-3.5" />
                        Open
                      </Link>
                      <Link href={`/rocks/${rock.id}/edit`} className="btn-secondary px-3 py-2 text-xs">
                        <PencilSquareIcon className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
                {isOpen ? (
                  <tr className="bg-background/70">
                    <td colSpan={colSpan} className="px-4 py-4">
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
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InlineQuickUpdateForm({
  rock,
  draft,
  canPatchRock,
  submitting,
  error,
  success,
  onDraftChange,
  onSubmit,
}: {
  rock: RockRow;
  draft: MeetingDraft;
  canPatchRock: boolean;
  submitting: boolean;
  error: string;
  success: string;
  onDraftChange: React.Dispatch<React.SetStateAction<MeetingDraft | null>>;
  onSubmit: () => Promise<void>;
}) {
  function setField<K extends keyof MeetingDraft>(field: K, value: MeetingDraft[K]) {
    onDraftChange((current) => (current ? { ...current, [field]: value } : current));
  }

  return (
    <div className="rounded-[24px] border border-border bg-background-secondary/90 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Meeting Update</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">{rock.title}</h3>
        </div>
        <div className="text-xs uppercase tracking-[0.16em] text-text-tertiary">
          Week of {draft.weekOf}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
          Week Of
          <input
            type="date"
            value={draft.weekOf}
            onChange={(event) => setField("weekOf", event.target.value)}
            className="input-field py-2.5"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
          Completion %
          <input
            type="number"
            min={0}
            max={100}
            value={draft.completionPct}
            onChange={(event) => setField("completionPct", Number(event.target.value))}
            className="input-field py-2.5"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
          Confidence
          <select
            value={draft.confidenceLevel}
            onChange={(event) => setField("confidenceLevel", event.target.value as ConfidenceLevel)}
            className="input-field py-2.5"
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
          Status
          <select
            value={draft.status}
            onChange={(event) => setField("status", event.target.value as RockStatusKey)}
            className="input-field py-2.5"
            disabled={!canPatchRock}
          >
            {Object.entries(ROCK_STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
            Progress Notes
            <textarea
              value={draft.progressNotes}
              onChange={(event) => setField("progressNotes", event.target.value)}
              className="input-field min-h-[110px]"
              placeholder="What moved this week?"
            />
          </label>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
              Risks
              <textarea
                value={draft.risks}
                onChange={(event) => setField("risks", event.target.value)}
                className="input-field min-h-[84px]"
                placeholder="Emerging risks"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
              Decisions Needed
              <textarea
                value={draft.decisions}
                onChange={(event) => setField("decisions", event.target.value)}
                className="input-field min-h-[84px]"
                placeholder="Leadership asks"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">
            Blockers
            <textarea
              value={draft.blockers}
              onChange={(event) => setField("blockers", event.target.value)}
              className="input-field min-h-[140px]"
              placeholder="Current blockers or dependencies"
            />
          </label>
          <label className="flex items-center gap-3 rounded-[20px] border border-border bg-background px-4 py-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={draft.needsAttention}
              onChange={(event) => setField("needsAttention", event.target.checked)}
              className="h-4 w-4 rounded border-border bg-background text-accent"
            />
            Flag for leadership attention
          </label>
        </div>
      </div>

      {!canPatchRock ? (
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-text-tertiary">
          Status changes require manager or executive access. Weekly note submission still works here.
        </p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-status-off-track/30 bg-status-off-track px-4 py-3 text-sm text-status-off-track">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-2xl border border-status-on-track/30 bg-status-on-track px-4 py-3 text-sm text-status-on-track">
          {success}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onSubmit} disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : "Save Meeting Update"}
        </button>
        <Link href={`/rocks/${rock.id}/updates/new`} className="btn-secondary">
          Open Full Form
        </Link>
      </div>
    </div>
  );
}

function ToggleGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">{label}</span>
      <div className="flex rounded-full border border-border bg-background p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              value === option.value
                ? "rounded-full bg-accent px-3 py-2 text-xs font-semibold text-background"
                : "rounded-full px-3 py-2 text-xs font-semibold text-text-secondary"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-accent/40 bg-accent px-4 py-2 text-sm font-semibold text-background"
          : "rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
      }
    >
      {label}
    </button>
  );
}

function getDefaultWeekOf() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return monday.toISOString().split("T")[0];
}
