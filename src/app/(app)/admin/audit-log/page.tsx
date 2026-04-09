import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/utils";

export default async function AuditLogPage() {
  let logs: any[] = [];
  try {
    logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    // DB not connected
  }

  const actionColors: Record<string, string> = {
    CREATE: "text-status-on-track bg-status-on-track",
    UPDATE: "text-status-at-risk bg-status-at-risk",
    DELETE: "text-status-off-track bg-status-off-track",
  };

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="All system actions are logged for compliance"
      />

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Timestamp</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Entity</th>
              <th className="px-4 py-3 text-left">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="px-4 py-3 text-sm text-text-tertiary">
                  {formatDate(log.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {log.user.name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      actionColors[log.action] || "text-text-secondary bg-background-tertiary"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {log.entityType}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-text-tertiary">
                  {log.entityId.slice(0, 12)}...
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-tertiary">
                  No audit log entries yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
