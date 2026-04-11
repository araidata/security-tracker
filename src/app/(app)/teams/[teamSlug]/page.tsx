import Link from "next/link";
import { notFound } from "next/navigation";
import { ScheduleWorkspace } from "@/components/schedule/schedule-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { DEPARTMENT_CONFIG } from "@/lib/constants";
import { getDepartmentFromSlug, getDepartmentScheduleTitle, parseScheduleYear } from "@/lib/schedule";
import { scheduleService } from "@/lib/services/schedule.service";

export const dynamic = "force-dynamic";

export default async function TeamSchedulePage({
  params,
  searchParams,
}: {
  params: { teamSlug: string };
  searchParams?: { year?: string };
}) {
  const department = getDepartmentFromSlug(params.teamSlug);
  if (!department) notFound();

  const fiscalYear = parseScheduleYear(searchParams?.year);

  let schedule = {
    fiscalYear,
    scheduledItems: [] as Awaited<ReturnType<typeof scheduleService.getSchedule>>["scheduledItems"],
    unscheduledAssignments: [] as Awaited<ReturnType<typeof scheduleService.getSchedule>>["unscheduledAssignments"],
  };

  try {
    schedule = await scheduleService.getSchedule({
      fiscalYear,
      department,
    });
  } catch {
    // DB not connected
  }

  const pagePath = `/teams/${params.teamSlug}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={getDepartmentScheduleTitle(department)}
        description={`Track ${DEPARTMENT_CONFIG[department].label} goals, rocks, and assignments on one schedule. Gantt view shows execution windows, while the calendar view shows the monthly target and due-date load.`}
      >
        <Link href={`${pagePath}?year=${fiscalYear - 1}`} className="btn-secondary">
          FY{fiscalYear - 1}
        </Link>
        <div className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-text-primary">
          FY{fiscalYear}
        </div>
        <Link href={`${pagePath}?year=${fiscalYear + 1}`} className="btn-secondary">
          FY{fiscalYear + 1}
        </Link>
      </PageHeader>

      <ScheduleWorkspace
        fiscalYear={fiscalYear}
        scheduledItems={schedule.scheduledItems}
        unscheduledAssignments={schedule.unscheduledAssignments}
        emptyTitle={`No scheduled ${DEPARTMENT_CONFIG[department].label} work yet`}
        emptyDescription="Create goals, rocks, and assignment due dates for this team to populate its planning views."
      />
    </div>
  );
}
