import Link from "next/link";
import { ScheduleWorkspace } from "@/components/schedule/schedule-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { scheduleService } from "@/lib/services/schedule.service";
import { parseScheduleYear } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function OrgPage({
  searchParams,
}: {
  searchParams?: { year?: string };
}) {
  const fiscalYear = parseScheduleYear(searchParams?.year);

  let schedule = {
    fiscalYear,
    scheduledItems: [] as Awaited<ReturnType<typeof scheduleService.getSchedule>>["scheduledItems"],
    unscheduledAssignments: [] as Awaited<ReturnType<typeof scheduleService.getSchedule>>["unscheduledAssignments"],
  };

  try {
    schedule = await scheduleService.getSchedule({ fiscalYear });
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Org Schedule"
        description="Review the combined org timeline across goals, rocks, and assignments. Use the Gantt view for year-long sequencing and the calendar view for month-by-month due dates."
      >
        <Link href={`/org?year=${fiscalYear - 1}`} className="btn-secondary">
          FY{fiscalYear - 1}
        </Link>
        <div className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-text-primary">
          FY{fiscalYear}
        </div>
        <Link href={`/org?year=${fiscalYear + 1}`} className="btn-secondary">
          FY{fiscalYear + 1}
        </Link>
      </PageHeader>

      <ScheduleWorkspace
        fiscalYear={fiscalYear}
        scheduledItems={schedule.scheduledItems}
        unscheduledAssignments={schedule.unscheduledAssignments}
        emptyTitle="No scheduled org work yet"
        emptyDescription="Create goals, rocks, and assignment due dates to populate the combined org timeline."
        groupByDepartment
      />
    </div>
  );
}
