import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function NewAssignmentPage({
  params,
}: {
  params: { rockId: string };
}) {
  let rock;
  let users: any[] = [];
  try {
    [rock, users] = await Promise.all([
      prisma.quarterlyRock.findUnique({
        where: { id: params.rockId },
        select: { id: true, title: true },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, department: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    // DB not connected
  }

  if (!rock) notFound();

  return (
    <div>
      <PageHeader
        title="New Assignment"
        description={`Adding assignment to: ${rock.title}`}
      />
      <AssignmentForm rockId={rock.id} users={users} />
    </div>
  );
}
