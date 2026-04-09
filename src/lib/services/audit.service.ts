import { prisma } from "@/lib/prisma";

export async function createAuditLog(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes ? JSON.parse(JSON.stringify(params.changes)) : undefined,
    },
  });
}
