import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { ROLE_CONFIG } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function UsersPage() {
  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        _count: {
          select: { ownedGoals: true, ownedRocks: true, assignments: true },
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage team members and roles"
      />

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Goals</th>
              <th className="px-4 py-3 text-left">Rocks</th>
              <th className="px-4 py-3 text-left">Tasks</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="table-row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-background-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
                    {ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]?.label || user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DepartmentBadge department={user.department} />
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {user._count.ownedGoals}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {user._count.ownedRocks}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {user._count.assignments}
                </td>
                <td className="px-4 py-3 text-sm text-text-tertiary">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
