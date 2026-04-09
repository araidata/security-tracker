import { prisma } from "@/lib/prisma";
import { GoalForm } from "@/components/goals/goal-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function NewGoalPage() {
  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      select: { id: true, name: true, department: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader title="Create Annual Goal" />
      <GoalForm users={users} />
    </div>
  );
}
