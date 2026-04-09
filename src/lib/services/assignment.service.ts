import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit.service";
import type { CreateAssignmentInput, UpdateAssignmentInput } from "@/lib/validations/assignment";
import type { TaskStatus } from "@prisma/client";

export const assignmentService = {
  async list(filters?: { rockId?: string; ownerId?: string; status?: string }) {
    return prisma.teamAssignment.findMany({
      where: {
        ...(filters?.rockId && { rockId: filters.rockId }),
        ...(filters?.ownerId && { ownerId: filters.ownerId }),
        ...(filters?.status && { status: filters.status as TaskStatus }),
      },
      include: {
        owner: { select: { id: true, name: true, department: true } },
        rock: { select: { id: true, title: true, goal: { select: { id: true, title: true } } } },
        contributors: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
  },

  async getById(id: string) {
    return prisma.teamAssignment.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        rock: { select: { id: true, title: true, goal: { select: { id: true, title: true } } } },
        contributors: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
  },

  async create(data: CreateAssignmentInput, userId: string) {
    const { contributorIds, ...rest } = data;

    const assignment = await prisma.teamAssignment.create({
      data: {
        ...rest,
        createdBy: userId,
        updatedBy: userId,
        ...(contributorIds && contributorIds.length > 0 && {
          contributors: {
            create: contributorIds.map((uid) => ({ userId: uid })),
          },
        }),
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entityType: "TeamAssignment",
      entityId: assignment.id,
      changes: data as unknown as Record<string, unknown>,
    });

    return assignment;
  },

  async update(id: string, data: UpdateAssignmentInput, userId: string) {
    const { contributorIds, ...rest } = data;
    const existing = await prisma.teamAssignment.findUnique({ where: { id } });

    const assignment = await prisma.teamAssignment.update({
      where: { id },
      data: {
        ...rest,
        updatedBy: userId,
      },
    });

    if (contributorIds) {
      await prisma.assignmentContributor.deleteMany({ where: { assignmentId: id } });
      if (contributorIds.length > 0) {
        await prisma.assignmentContributor.createMany({
          data: contributorIds.map((uid) => ({ assignmentId: id, userId: uid })),
        });
      }
    }

    await createAuditLog({
      userId,
      action: "UPDATE",
      entityType: "TeamAssignment",
      entityId: assignment.id,
      changes: { before: existing, after: data },
    });

    return assignment;
  },
};
