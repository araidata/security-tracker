"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { GoalStatusBadge, RockStatusBadge, TaskStatusBadge } from "@/components/shared/status-badge";
import { DEPARTMENT_CONFIG, DEPARTMENT_ORDER } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { dateFromKey, type ScheduleItem, type ScheduleItemType } from "@/lib/schedule";

type ViewMode = "GANTT" | "CALENDAR";

interface ScheduleWorkspaceProps {
  fiscalYear: number;
  scheduledItems: ScheduleItem[];
  unscheduledAssignments: ScheduleItem[];
  emptyTitle: string;
  emptyDescription: string;
  groupByDepartment?: boolean;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ITEM_TYPE_CONFIG: Record<
  ScheduleItemType,
  { label: string; pillClassName: string; barClassName: string; calendarClassName: string }
> = {
  GOAL: {
    label: "Goal",
    pillClassName: "border-accent/25 bg-accent/10 text-accent",
    barClassName: "border border-accent/40 bg-accent/20 text-accent",
    calendarClassName: "border-accent/20 bg-accent/10 text-accent",
  },
  ROCK: {
    label: "Rock",
    pillClassName: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    barClassName: "border border-emerald-400/30 bg-emerald-400/15 text-emerald-100",
    calendarClassName: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  },
  ASSIGNMENT: {
    label: "Assignment",
    pillClassName: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    barClassName: "border border-amber-300/35 bg-amber-300/18 text-amber-50",
    calendarClassName: "border-amber-300/20 bg-amber-300/10 text-amber-50",
  },
};

export function ScheduleWorkspace({
  fiscalYear,
  scheduledItems,
  unscheduledAssignments,
  emptyTitle,
  emptyDescription,
  groupByDepartment = false,
}: ScheduleWorkspaceProps) {
  const [view, setView] = useState<ViewMode>("GANTT");
  const [monthIndex, setMonthIndex] = useState(() => {
    const today = new Date();
    return today.getFullYear() === fiscalYear ? today.getMonth() : 0;
  });

  const summary = scheduledItems.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.entityType] += 1;
      return acc;
    },
    { total: 0, GOAL: 0, ROCK: 0, ASSIGNMENT: 0 }
  );

  const groupedItems = groupByDepartment
    ? DEPARTMENT_ORDER.map((department) => ({
        key: department,
        label: DEPARTMENT_CONFIG[department].label,
        items: scheduledItems.filter((item) => item.department === department),
      })).filter((group) => group.items.length > 0)
    : [
        {
          key: "ALL",
          label: "Timeline",
          items: scheduledItems,
        },
      ];

  if (scheduledItems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="card flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Schedule Views</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">{emptyTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">{emptyDescription}</p>
          </div>
          <div className="grid min-w-[18rem] gap-3 sm:grid-cols-2">
            <MetricCard label="Goals" value="0" />
            <MetricCard label="Rocks" value="0" />
            <MetricCard label="Scheduled Assignments" value="0" />
            <MetricCard label="Unscheduled Assignments" value={String(unscheduledAssignments.length)} />
          </div>
        </div>
        {unscheduledAssignments.length > 0 && <UnscheduledAssignments assignments={unscheduledAssignments} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Schedule Views</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">Gantt and calendar planning</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
              Gantt view shows execution windows across FY{fiscalYear}. Calendar view shows goal and rock target dates plus assignment due dates for the selected month.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ToggleGroup
              label="View"
              value={view}
              options={[
                { label: "Gantt", value: "GANTT" },
                { label: "Calendar", value: "CALENDAR" },
              ]}
              onChange={(value) => setView(value as ViewMode)}
            />
            <MonthNavigator
              fiscalYear={fiscalYear}
              monthIndex={monthIndex}
              onChange={setMonthIndex}
              disabled={view !== "CALENDAR"}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Scheduled Items" value={String(summary.total)} />
          <MetricCard label="Goals" value={String(summary.GOAL)} />
          <MetricCard label="Rocks" value={String(summary.ROCK)} />
          <MetricCard label="Assignments" value={`${summary.ASSIGNMENT} scheduled / ${unscheduledAssignments.length} unscheduled`} />
        </div>
      </div>

      {view === "GANTT" ? (
        <div className="space-y-4">
          {groupedItems.map((group) => (
            <GanttSection key={group.key} fiscalYear={fiscalYear} title={group.label} items={group.items} />
          ))}
        </div>
      ) : (
        <CalendarView
          fiscalYear={fiscalYear}
          monthIndex={monthIndex}
          items={scheduledItems}
          groupByDepartment={groupByDepartment}
        />
      )}

      {unscheduledAssignments.length > 0 && <UnscheduledAssignments assignments={unscheduledAssignments} />}
    </div>
  );
}

function GanttSection({
  fiscalYear,
  title,
  items,
}: {
  fiscalYear: number;
  title: string;
  items: ScheduleItem[];
}) {
  return (
    <section className="table-shell">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{title}</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">{items.length} scheduled items</h3>
        </div>
        <div className="text-xs uppercase tracking-[0.16em] text-text-tertiary">FY{fiscalYear} timeline</div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-[360px_minmax(760px,1fr)] table-header">
            <div className="px-5 py-4 text-left">Workstream</div>
            <div className="grid grid-cols-12">
              {MONTH_LABELS.map((label) => (
                <div key={label} className="border-l border-border/60 px-3 py-4 text-left first:border-l-0">
                  {label}
                </div>
              ))}
            </div>
          </div>
          {items.map((item) => (
            <GanttRow key={`${item.entityType}-${item.id}`} fiscalYear={fiscalYear} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GanttRow({ fiscalYear, item }: { fiscalYear: number; item: ScheduleItem }) {
  const start = item.startDateKey ?? item.anchorDateKey;
  const end = item.endDateKey ?? item.anchorDateKey;
  const anchor = item.anchorDateKey;

  if (!start || !end || !anchor) return null;

  const typeConfig = ITEM_TYPE_CONFIG[item.entityType];
  const yearStart = new Date(fiscalYear, 0, 1);
  const yearEnd = new Date(fiscalYear, 11, 31);
  const startDate = clampDate(dateFromKey(start), yearStart, yearEnd);
  const endDate = clampDate(dateFromKey(end), yearStart, yearEnd);

  const totalDays = getDaysBetween(yearStart, yearEnd) + 1;
  const startOffset = getDaysBetween(yearStart, startDate);
  const duration = Math.max(1, getDaysBetween(startDate, endDate) + 1);
  const left = (startOffset / totalDays) * 100;
  const width = Math.min(100 - left, Math.max((duration / totalDays) * 100, 1.8));

  return (
    <div className="grid grid-cols-[360px_minmax(760px,1fr)] table-row">
      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", typeConfig.pillClassName)}>
            {typeConfig.label}
          </span>
          <DepartmentBadge department={item.department} />
        </div>
        <div>
          <Link href={item.href} className="text-sm font-semibold text-text-primary transition-colors hover:text-accent">
            {item.title}
          </Link>
          <p className="mt-1 text-sm text-text-secondary">
            {item.goalTitle ? `${item.goalTitle}` : "Strategic target"}
            {item.rockTitle ? ` / ${item.rockTitle}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScheduleStatusBadge item={item} />
          <span className="text-xs text-text-tertiary">Owner: {item.ownerName}</span>
          <span className="text-xs text-text-tertiary">{formatDate(dateFromKey(anchor))}</span>
        </div>
      </div>
      <div className="relative h-[106px] overflow-hidden px-3 py-4">
        <div className="absolute inset-0 grid grid-cols-12">
          {MONTH_LABELS.map((label) => (
            <div key={label} className="border-l border-border/60 first:border-l-0" />
          ))}
        </div>
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border/70" />
        <Link
          href={item.href}
          className={cn(
            "absolute top-1/2 flex h-11 -translate-y-1/2 items-center rounded-2xl px-3 text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-[55%]",
            typeConfig.barClassName
          )}
          style={{ left: `${left}%`, width: `${width}%` }}
        >
          <span className="truncate">{item.title}</span>
        </Link>
      </div>
    </div>
  );
}

function CalendarView({
  fiscalYear,
  monthIndex,
  items,
  groupByDepartment,
}: {
  fiscalYear: number;
  monthIndex: number;
  items: ScheduleItem[];
  groupByDepartment: boolean;
}) {
  const monthDays = buildCalendarDays(fiscalYear, monthIndex);
  const itemsByDate = items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    if (!item.anchorDateKey) return acc;
    if (!acc[item.anchorDateKey]) {
      acc[item.anchorDateKey] = [];
    }
    acc[item.anchorDateKey].push(item);
    return acc;
  }, {});

  return (
    <section className="table-shell overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Calendar View</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
              new Date(fiscalYear, monthIndex, 1)
            )}
          </h3>
        </div>
        <div className="text-sm text-text-secondary">Target dates and due dates grouped on a monthly planning grid.</div>
      </div>
      <div className="hidden grid-cols-7 table-header md:grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="px-3 py-3 text-left">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7">
        {monthDays.map((day) => {
          const itemsForDay = (itemsByDate[day.dateKey] || []).sort((a, b) => a.title.localeCompare(b.title));

          return (
            <div
              key={day.dateKey}
              className={cn(
                "min-h-[12rem] border-b border-r border-border/80 bg-background-secondary/35 p-3 md:min-h-[13rem]",
                !day.inCurrentMonth && "bg-background/55 text-text-tertiary"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                    day.inCurrentMonth ? "bg-background text-text-primary" : "bg-transparent text-text-tertiary"
                  )}
                >
                  {day.dayOfMonth}
                </span>
                {itemsForDay.length > 0 && (
                  <span className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                    {itemsForDay.length} item{itemsForDay.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {itemsForDay.length === 0 ? (
                  <p className="text-xs text-text-tertiary">No scheduled items</p>
                ) : (
                  itemsForDay.map((item) => {
                    const config = ITEM_TYPE_CONFIG[item.entityType];

                    return (
                      <Link
                        key={`${item.entityType}-${item.id}`}
                        href={item.href}
                        className={cn(
                          "block rounded-2xl border px-3 py-2 text-xs transition-colors hover:border-border-strong hover:bg-background/60",
                          config.calendarClassName
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold uppercase tracking-[0.14em]">{config.label}</span>
                          {groupByDepartment && (
                            <span className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
                              {DEPARTMENT_CONFIG[item.department].shortLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium normal-case tracking-normal text-current">{item.title}</p>
                        <p className="mt-1 text-[11px] normal-case tracking-normal text-text-secondary">
                          {item.rockTitle ? `${item.rockTitle} · ` : ""}
                          {item.ownerName}
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UnscheduledAssignments({ assignments }: { assignments: ScheduleItem[] }) {
  return (
    <section className="table-shell">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Unscheduled Work</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">
            {assignments.length} assignments still need a due date
          </h3>
        </div>
        <div className="text-sm text-text-secondary">These items stay out of the calendar and Gantt views until they are scheduled.</div>
      </div>
      <div className="divide-y divide-border/80">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", ITEM_TYPE_CONFIG.ASSIGNMENT.pillClassName)}>
                  Assignment
                </span>
                <DepartmentBadge department={assignment.department} />
                <TaskStatusBadge status={assignment.status as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"} compact />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">{assignment.title}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {assignment.goalTitle ? `${assignment.goalTitle}` : "Goal pending"}
                {assignment.rockTitle ? ` / ${assignment.rockTitle}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-text-tertiary">Owner: {assignment.ownerName}</span>
              <Link href={assignment.href} className="btn-secondary">
                Open Rock
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-border bg-background/70 px-4 py-4">
      <p className="metric-label">{label}</p>
      <p className="mt-3 text-xl font-semibold text-text-primary">{value}</p>
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

function MonthNavigator({
  fiscalYear,
  monthIndex,
  onChange,
  disabled,
}: {
  fiscalYear: number;
  monthIndex: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(fiscalYear, monthIndex, 1)
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Month</span>
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, monthIndex - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary disabled:opacity-40"
          disabled={disabled || monthIndex === 0}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <div className={cn("min-w-[8.5rem] text-center text-sm font-medium", disabled ? "text-text-tertiary" : "text-text-primary")}>
          {label}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(11, monthIndex + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary disabled:opacity-40"
          disabled={disabled || monthIndex === 11}
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ScheduleStatusBadge({ item }: { item: ScheduleItem }) {
  if (item.entityType === "GOAL") {
    return <GoalStatusBadge status={item.status as "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "COMPLETED"} compact />;
  }

  if (item.entityType === "ROCK") {
    return (
      <RockStatusBadge
        status={item.status as "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "OVERDUE"}
        compact
      />
    );
  }

  return <TaskStatusBadge status={item.status as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"} compact />;
}

function buildCalendarDays(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, offset) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + offset);

    return {
      dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      dayOfMonth: date.getDate(),
      inCurrentMonth: date.getMonth() === monthIndex,
    };
  });
}

function clampDate(date: Date, min: Date, max: Date) {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

function getDaysBetween(start: Date, end: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  const startAtMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endAtMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.round((endAtMidnight - startAtMidnight) / oneDay);
}
