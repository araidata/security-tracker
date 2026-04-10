import Link from "next/link";
import { assignmentService } from "@/lib/services/assignment.service";
import { PageHeader } from "@/components/shared/page-header";
import { TaskStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteEntityButton } from "@/components/shared/delete-entity-button";
import { formatDate } from "@/lib/utils";

export default async function AssignmentsPage() {
  let assignments: any[] = [];
  try {
    assignments = await assignmentService.list();
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader
        title="Team Assignments"
        description="Individual work items broken down from quarterly rocks"
      />

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assignments are created from within a Rock's detail page"
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Assignment</th>
                <th className="px-4 py-3 text-left">Rock</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Contributors</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {a.title}
                    </p>
                    {a.description && (
                      <p className="mt-0.5 text-xs text-text-tertiary line-clamp-1">
                        {a.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/rocks/${a.rock.id}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {a.rock.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {a.owner.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary">
                    {a.contributors.length > 0
                      ? a.contributors.map((c: any) => c.user.name).join(", ")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary">
                    {a.dueDate ? formatDate(a.dueDate) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteEntityButton
                      entityName="Assignment"
                      endpoint={`/api/assignments/${a.id}`}
                      redirectTo="/assignments"
                      allowedRoles={["EXECUTIVE", "MANAGER"]}
                      confirmMessage={`Delete "${a.title}"? This cannot be undone.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
