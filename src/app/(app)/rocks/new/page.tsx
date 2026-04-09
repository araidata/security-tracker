import { prisma } from "@/lib/prisma";
import { RockForm } from "@/components/rocks/rock-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function NewRockPage({
  searchParams,
}: {
  searchParams: { goalId?: string };
}) {
  let goals: any[] = [];
  let users: any[] = [];
  try {
    [goals, users] = await Promise.all([
      prisma.annualGoal.findMany({
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, department: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader title="Create Quarterly Rock" />
      <RockForm
        goals={goals}
        users={users}
        defaultGoalId={searchParams.goalId}
      />
    </div>
  );
}
