"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowTopRightOnSquareIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { GoalStatusBadge } from "@/components/shared/status-badge";
import {
  DEPARTMENT_CONFIG,
  DEPARTMENT_ORDER,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from "@/lib/constants";
import { formatDate, formatPercent } from "@/lib/utils";

type DepartmentKey = keyof typeof DEPARTMENT_CONFIG;

interface GoalRow {
  id: string;
  title: string;
  description: string;
  department: DepartmentKey;
  status: keyof typeof STATUS_CONFIG;
  priority: keyof typeof PRIORITY_CONFIG;
  completionPct: number;
  targetDate: Date | string;
  owner: { name: string };
  _count: { rocks: number };
}

type DensityMode = "DETAILED" | "CONDENSED";
type OrganizationMode = "GROUPED" | "ALL";
type DepartmentFilter = "ALL" | DepartmentKey;

export function GoalsWorkspace({ goals }: { goals: GoalRow[] }) {
  const [density, setDensity] = useState<DensityMode>("CONDENSED");
  const [organization, setOrganization] = useState<OrganizationMode>("GROUPED");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("ALL");

  const filteredGoals = goals
    .filter((goal) => departmentFilter === "ALL" || goal.department === departmentFilter)
    .sort((a, b) => {
      const departmentDelta =
        DEPARTMENT_ORDER.indexOf(a.department) - DEPARTMENT_ORDER.indexOf(b.department);
      if (departmentDelta !== 0) return departmentDelta;
      return a.title.localeCompare(b.title);
    });

  const groupedGoals = DEPARTMENT_ORDER.map((department) => ({
    department,
    items: filteredGoals.filter((goal) => goal.department === department),
  })).filter((group) => group.items.length > 0);

  const isCondensed = density === "CONDENSED";
  const showGrouped = organization === "GROUPED";

  return (
    <div className="space-y-4">
      <WorkspaceControls
        density={density}
        organization={organization}
        departmentFilter={departmentFilter}
        onDensityChange={setDensity}
        onOrganizationChange={setOrganization}
        onDepartmentFilterChange={(value) => setDepartmentFilter(value as DepartmentFilter)}
      />

      {showGrouped ? (
        <div className="space-y-4">
          {groupedGoals.map((group) => (
            <section key={group.department} className="table-shell">
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">{DEPARTMENT_CONFIG[group.department].label}</p>
                  <h2 className="mt-2 text-xl font-semibold text-text-primary">
                    {group.items.length} goals in this department
                  </h2>
                </div>
                <div className="text-xs uppercase tracking-[0.16em] text-text-tertiary">
                  Meeting workspace
                </div>
              </div>
              <GoalsTable goals={group.items} condensed={isCondensed} />
            </section>
          ))}
        </div>
      ) : (
        <div className="table-shell">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">All Departments</p>
              <h2 className="mt-2 text-xl font-semibold text-text-primary">
                Cross-functional goal list
              </h2>
            </div>
            <div className="text-xs uppercase tracking-[0.16em] text-text-tertiary">
              {filteredGoals.length} goals shown
            </div>
          </div>
          <GoalsTable goals={filteredGoals} condensed={isCondensed} />
        </div>
      )}
    </div>
  );
}

function WorkspaceControls({
  density,
  organization,
  departmentFilter,
  onDensityChange,
  onOrganizationChange,
  onDepartmentFilterChange,
}: {
  density: DensityMode;
  organization: OrganizationMode;
  departmentFilter: DepartmentFilter;
  onDensityChange: (value: DensityMode) => void;
  onOrganizationChange: (value: OrganizationMode) => void;
  onDepartmentFilterChange: (value: string) => void;
}) {
  return (
    <div className="card flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex-1">
        <p className="eyebrow">Meeting Mode</p>
        <p className="mt-2 text-sm text-text-secondary">
          Filter directly by department, or keep everything visible in a department-sorted meeting sheet.
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

function GoalsTable({ goals, condensed }: { goals: GoalRow[]; condensed: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="table-header">
            <th className={condensed ? "px-4 py-3 text-left" : "px-5 py-4 text-left"}>Goal</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Dept</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Owner</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Status</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Priority</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Completion</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Rocks</th>
            <th className={condensed ? "px-3 py-3 text-left" : "px-4 py-4 text-left"}>Target</th>
            <th className={condensed ? "px-4 py-3 text-left" : "px-5 py-4 text-left"}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => (
            <tr key={goal.id} className="table-row align-top">
              <td className={condensed ? "px-4 py-3" : "px-5 py-5"}>
                <Link href={`/goals/${goal.id}`} className="text-sm font-semibold text-text-primary transition-colors hover:text-accent">
                  {goal.title}
                </Link>
                {!condensed && (
                  <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                    {goal.description}
                  </p>
                )}
              </td>
              <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                <DepartmentBadge department={goal.department} />
              </td>
              <td className={condensed ? "px-3 py-3 text-sm text-text-secondary" : "px-4 py-5 text-sm text-text-secondary"}>
                {goal.owner.name}
              </td>
              <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                <GoalStatusBadge status={goal.status} />
              </td>
              <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                <PriorityBadge priority={goal.priority} />
              </td>
              <td className={condensed ? "px-3 py-3" : "px-4 py-5"}>
                <div className={condensed ? "w-28" : "w-36"}>
                  <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
                    <span>{formatPercent(goal.completionPct)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${Math.min(goal.completionPct, 100)}%` }} />
                  </div>
                </div>
              </td>
              <td className={condensed ? "px-3 py-3 text-sm text-text-secondary" : "px-4 py-5 text-sm text-text-secondary"}>
                {goal._count.rocks}
              </td>
              <td className={condensed ? "px-3 py-3 text-sm text-text-secondary" : "px-4 py-5 text-sm text-text-secondary"}>
                {formatDate(goal.targetDate)}
              </td>
              <td className={condensed ? "px-4 py-3" : "px-5 py-5"}>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/goals/${goal.id}`} className="btn-secondary px-3 py-2 text-xs">
                    <ArrowTopRightOnSquareIcon className="mr-1.5 h-3.5 w-3.5" />
                    Open
                  </Link>
                  <Link href={`/goals/${goal.id}/edit`} className="btn-primary px-3 py-2 text-xs">
                    <PencilSquareIcon className="mr-1.5 h-3.5 w-3.5" />
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
