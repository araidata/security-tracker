import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "./audit.service";
import { goalService } from "./goal.service";
import type { CreateWeeklyUpdateInput, UpdateWeeklyUpdateInput } from "@/lib/validations/update";

const updateIncludes = {
  author: { select: { id: true, name: true } },
  rock: {
    select: {
      id: true,
      title: true,
      department: true,
      owner: { select: { id: true, name: true } },
      goal: { select: { id: true, title: true } },
    },
  },
} as const;

export const updateService = {
  async listByRock(rockId: string) {
    return prisma.weeklyUpdate.findMany({
      where: { rockId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { weekOf: "desc" },
    });
  },

  async listRecent(limit: number = 20) {
    return prisma.weeklyUpdate.findMany({
      include: {
        author: { select: { id: true, name: true } },
        rock: { select: { id: true, title: true, goal: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async listFiltered(filters: {
    department?: string;
    goalId?: string;
    rockId?: string;
    providedBy?: string;
    needsAttention?: boolean;
  } = {}) {
    const where: Prisma.WeeklyUpdateWhereInput = {};

    if (filters.rockId) {
      where.rockId = filters.rockId;
    }
    if (filters.department) {
      where.rock = { ...((where.rock as Prisma.QuarterlyRockWhereInput) || {}), department: filters.department as any };
    }
    if (filters.goalId) {
      where.rock = { ...((where.rock as Prisma.QuarterlyRockWhereInput) || {}), goalId: filters.goalId };
    }
    if (filters.providedBy) {
      where.providedBy = { contains: filters.providedBy, mode: "insensitive" };
    }
    if (filters.needsAttention !== undefined) {
      where.needsAttention = filters.needsAttention;
    }

    return prisma.weeklyUpdate.findMany({
      where,
      include: updateIncludes,
      orderBy: { weekOf: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.weeklyUpdate.findUnique({
      where: { id },
      include: updateIncludes,
    });
  },

  async create(data: CreateWeeklyUpdateInput, userId: string) {
    const update = await prisma.weeklyUpdate.create({
      data: {
        ...data,
        authorId: userId,
      },
    });

    // Derive rock status from this update
    await prisma.quarterlyRock.update({
      where: { id: data.rockId },
      data: {
        completionPct: data.completionPct,
        confidence: data.confidenceLevel,
        isStale: false,
        ...(data.completionPct >= 100 ? { status: "COMPLETED" } : {}),
      },
    });

    // Recalculate parent goal
    const rock = await prisma.quarterlyRock.findUnique({
      where: { id: data.rockId },
      select: { goalId: true },
    });
    if (rock) {
      await goalService.recalculateCompletion(rock.goalId);
    }

    await createAuditLog({
      userId,
      action: "CREATE",
      entityType: "WeeklyUpdate",
      entityId: update.id,
      changes: data as unknown as Record<string, unknown>,
    });

    return update;
  },

  async update(id: string, data: UpdateWeeklyUpdateInput, userId: string) {
    const existing = await prisma.weeklyUpdate.findUnique({
      where: { id },
      select: { rockId: true, completionPct: true, confidenceLevel: true },
    });
    if (!existing) throw new Error("Update not found");

    try {
      const updated = await prisma.weeklyUpdate.update({
        where: { id },
        data: data as any,
        include: updateIncludes,
      });

      // Sync parent rock if completion or confidence changed
      if (data.completionPct !== undefined || data.confidenceLevel !== undefined) {
        const latestUpdate = await prisma.weeklyUpdate.findFirst({
          where: { rockId: existing.rockId },
          orderBy: { weekOf: "desc" },
        });
        if (latestUpdate) {
          await prisma.quarterlyRock.update({
            where: { id: existing.rockId },
            data: {
              completionPct: latestUpdate.completionPct,
              confidence: latestUpdate.confidenceLevel,
              isStale: false,
              ...(latestUpdate.completionPct >= 100 ? { status: "COMPLETED" as const } : {}),
            },
          });
        }

        const rock = await prisma.quarterlyRock.findUnique({
          where: { id: existing.rockId },
          select: { goalId: true },
        });
        if (rock) {
          await goalService.recalculateCompletion(rock.goalId);
        }
      }

      await createAuditLog({
        userId,
        action: "UPDATE",
        entityType: "WeeklyUpdate",
        entityId: id,
        changes: data as unknown as Record<string, unknown>,
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("An update already exists for this rock on the selected week.");
      }
      throw error;
    }
  },

  async delete(id: string, userId: string) {
    const existing = await prisma.weeklyUpdate.findUnique({
      where: { id },
      select: { rockId: true },
    });
    if (!existing) throw new Error("Update not found");

    await prisma.weeklyUpdate.delete({ where: { id } });

    // Re-derive rock completion from most recent remaining update
    const latestRemaining = await prisma.weeklyUpdate.findFirst({
      where: { rockId: existing.rockId },
      orderBy: { weekOf: "desc" },
    });

    if (latestRemaining) {
      await prisma.quarterlyRock.update({
        where: { id: existing.rockId },
        data: {
          completionPct: latestRemaining.completionPct,
          confidence: latestRemaining.confidenceLevel,
          isStale: false,
        },
      });
    } else {
      await prisma.quarterlyRock.update({
        where: { id: existing.rockId },
        data: { completionPct: 0, isStale: true },
      });
    }

    // Recalculate parent goal
    const rock = await prisma.quarterlyRock.findUnique({
      where: { id: existing.rockId },
      select: { goalId: true },
    });
    if (rock) {
      await goalService.recalculateCompletion(rock.goalId);
    }

    await createAuditLog({
      userId,
      action: "DELETE",
      entityType: "WeeklyUpdate",
      entityId: id,
    });

    return { success: true };
  },
};
