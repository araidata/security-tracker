import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit.service";
import { goalService } from "./goal.service";
import type { CreateWeeklyUpdateInput } from "@/lib/validations/update";

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
};
