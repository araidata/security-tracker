import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rockService } from "@/lib/services/rock.service";
import { RockForm } from "@/components/rocks/rock-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function EditRockPage({
  params,
}: {
  params: { rockId: string };
}) {
  let rock;
  let goals: any[] = [];
  let users: any[] = [];
  try {
    [rock, goals, users] = await Promise.all([
      rockService.getById(params.rockId),
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
    notFound();
  }
  if (!rock) notFound();

  return (
    <div>
      <PageHeader title="Edit Rock" />
      <RockForm
        rock={{
          ...rock,
          targetDate: rock.targetDate.toISOString(),
          kpiMetric: rock.kpiMetric,
          blockers: rock.blockers,
        }}
        goals={goals}
        users={users}
      />
    </div>
  );
}
