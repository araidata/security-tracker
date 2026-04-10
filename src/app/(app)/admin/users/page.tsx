import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { UsersWorkspace } from "@/components/admin/users-workspace";
import { userService } from "@/lib/services/user.service";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "EXECUTIVE") {
    redirect("/dashboard");
  }

  let users: any[] = [];
  try {
    users = await userService.listAdminUsers();
  } catch {
    // DB not connected
  }

  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Add team members, update access levels, and keep department ownership current."
      />
      <UsersWorkspace
        initialUsers={serializedUsers}
        currentUserId={session.user.id}
      />
    </div>
  );
}
