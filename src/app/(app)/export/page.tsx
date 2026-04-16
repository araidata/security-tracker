import { PageHeader } from "@/components/shared/page-header";
import { ExportContent } from "@/components/export/export-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEPT_IDX: Record<string, number> = { SEC_OPS: 0, SAE: 1, GRC: 2 };

export default async function ExportPage() {
  const year = new Date().getFullYear();

  let goals: any[] = [];
  let rocks: any[] = [];
  let updates: any[] = [];

  try {
    [goals, rocks, updates] = await Promise.all([
      prisma.annualGoal.findMany({
        where: { fiscalYear: year, department: { not: "ADMIN" } },
        select: { id: true, title: true, department: true, status: true, completionPct: true },
      }),
      prisma.quarterlyRock.findMany({
        where: { fiscalYear: year, department: { not: "ADMIN" } },
        select: {
          id: true,
          goalId: true,
          title: true,
          status: true,
          completionPct: true,
          quarter: true,
          department: true,
          owner: { select: { name: true } },
        },
        orderBy: [{ quarter: "asc" }, { title: "asc" }],
      }),
      prisma.weeklyUpdate.findMany({
        where: { rock: { fiscalYear: year, department: { not: "ADMIN" } } },
        select: {
          id: true,
          rockId: true,
          weekOf: true,
          progressNotes: true,
          blockers: true,
          needsAttention: true,
          completionPct: true,
        },
        orderBy: [{ weekOf: "desc" }, { createdAt: "desc" }],
      }),
    ]);
  } catch {
    // DB not connected
  }

  // Sort goals: department order then title
  goals.sort((a: any, b: any) => {
    const di = (DEPT_IDX[a.department] ?? 99) - (DEPT_IDX[b.department] ?? 99);
    return di !== 0 ? di : a.title.localeCompare(b.title);
  });

  // Serialize dates for client
  const serializedUpdates = updates.map((u: any) => ({
    ...u,
    weekOf: u.weekOf instanceof Date ? u.weekOf.toISOString() : u.weekOf,
  }));

  return (
    <div className="space-y-3">
      <PageHeader title="Export" description="Generate formatted reports for Teams or Confluence." />
      <ExportContent goals={goals} rocks={rocks} updates={serializedUpdates} />
    </div>
  );
}
