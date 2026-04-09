import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit.service";
import { goalService } from "./goal.service";
import type { CreateRockInput, UpdateRockInput } from "@/lib/validations/rock";
import type { Department, Quarter, RockStatus } from "@prisma/client";
import { subDays } from "date-fns";

export const rockService = {
  async list(filters?: {
    quarter?: string;
    fiscalYear?: number;
    department?: string;
    status?: string;
    goalId?: string;
    ownerId?: string;
  }) {
    return prisma.quarterlyRock.findMany({
      where: {
        ...(filters?.quarter && { quarter: filters.quarter as Quarter }),
        ...(filters?.fiscalYear && { fiscalYear: filters.fiscalYear }),
        ...(filters?.department && { department: filters.department as Department }),
        ...(filters?.status && { status: filters.status as RockStatus }),
        ...(filters?.goalId && { goalId: filters.goalId }),
        ...(filters?.ownerId && { ownerId: filters.ownerId }),
      },
      include: {
        owner: { select: { id: true, name: true, department: true } },
        goal: { select: { id: true, title: true } },
        _count: { select: { assignments: true, weeklyUpdates: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  },

  async getById(id: string) {
    return prisma.quarterlyRock.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, department: true } },
        goal: { select: { id: true, title: true } },
        assignments: {
          include: {
            owner: { select: { id: true, name: true } },
            contributors: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        weeklyUpdates: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { weekOf: "desc" },
          take: 10,
        },
      },
    });
  },

  async create(data: CreateRockInput, userId: string) {
    const rock = await prisma.quarterlyRock.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entityType: "QuarterlyRock",
      entityId: rock.id,
      changes: data as unknown as Record<string, unknown>,
    });

    await goalService.recalculateCompletion(data.goalId);

    return rock;
  },

  async update(id: string, data: UpdateRockInput, userId: string) {
    const existing = await prisma.quarterlyRock.findUnique({ where: { id } });
    const rock = await prisma.quarterlyRock.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "UPDATE",
      entityType: "QuarterlyRock",
      entityId: rock.id,
      changes: { before: existing, after: data },
    });

    if (existing) {
      await goalService.recalculateCompletion(existing.goalId);
    }

    return rock;
  },

  async delete(id: string, userId: string) {
    const rock = await prisma.quarterlyRock.findUnique({ where: { id } });
    if (!rock) throw new Error("Rock not found");

    await prisma.quarterlyRock.delete({ where: { id } });

    await createAuditLog({
      userId,
      action: "DELETE",
      entityType: "QuarterlyRock",
      entityId: id,
    });

    await goalService.recalculateCompletion(rock.goalId);
  },

  async markStaleRocks() {
    const fourteenDaysAgo = subDays(new Date(), 14);

    await prisma.quarterlyRock.updateMany({
      where: {
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        isStale: false,
        weeklyUpdates: {
          none: { createdAt: { gte: fourteenDaysAgo } },
        },
      },
      data: { isStale: true },
    });

    // Unmark rocks that got recent updates
    await prisma.quarterlyRock.updateMany({
      where: {
        isStale: true,
        weeklyUpdates: {
          some: { createdAt: { gte: fourteenDaysAgo } },
        },
      },
      data: { isStale: false },
    });
  },

  async markOverdueRocks() {
    const now = new Date();
    await prisma.quarterlyRock.updateMany({
      where: {
        targetDate: { lt: now },
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
      data: { status: "OVERDUE" },
    });
  },
};
