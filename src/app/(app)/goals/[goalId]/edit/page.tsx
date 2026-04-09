import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { goalService } from "@/lib/services/goal.service";
import { GoalForm } from "@/components/goals/goal-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function EditGoalPage({
  params,
}: {
  params: { goalId: string };
}) {
  let goal;
  let users: any[] = [];
  try {
    [goal, users] = await Promise.all([
      goalService.getById(params.goalId),
      prisma.user.findMany({
        select: { id: true, name: true, department: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    notFound();
  }
  if (!goal) notFound();

  return (
    <div>
      <PageHeader title="Edit Goal" />
      <GoalForm
        goal={{
          ...goal,
          targetDate: goal.targetDate.toISOString(),
          metrics: goal.metrics,
        }}
        users={users}
      />
    </div>
  );
}
