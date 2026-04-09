import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit.service";
import type { CreateGoalInput, UpdateGoalInput } from "@/lib/validations/goal";
import type { Department, GoalStatus } from "@prisma/client";

export const goalService = {
  async list(filters?: {
    fiscalYear?: number;
    department?: string;
    status?: string;
    ownerId?: string;
  }) {
    return prisma.annualGoal.findMany({
      where: {
        ...(filters?.fiscalYear && { fiscalYear: filters.fiscalYear }),
        ...(filters?.department && { department: filters.department as Department }),
        ...(filters?.status && { status: filters.status as GoalStatus }),
        ...(filters?.ownerId && { ownerId: filters.ownerId }),
      },
      include: {
        owner: { select: { id: true, name: true, department: true } },
        _count: { select: { rocks: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  },

  async getById(id: string) {
    return prisma.annualGoal.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, department: true } },
        rocks: {
          include: {
            owner: { select: { id: true, name: true } },
          },
          orderBy: { quarter: "asc" },
        },
        monthlyReviews: { orderBy: { month: "desc" }, take: 3 },
        quarterlyReviews: { orderBy: { quarter: "desc" }, take: 2 },
      },
    });
  },

  async create(data: CreateGoalInput, userId: string) {
    const goal = await prisma.annualGoal.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entityType: "AnnualGoal",
      entityId: goal.id,
      changes: data as unknown as Record<string, unknown>,
    });

    return goal;
  },

  async update(id: string, data: UpdateGoalInput, userId: string) {
    const existing = await prisma.annualGoal.findUnique({ where: { id } });
    const goal = await prisma.annualGoal.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "UPDATE",
      entityType: "AnnualGoal",
      entityId: goal.id,
      changes: { before: existing, after: data },
    });

    return goal;
  },

  async delete(id: string, userId: string) {
    await prisma.annualGoal.delete({ where: { id } });

    await createAuditLog({
      userId,
      action: "DELETE",
      entityType: "AnnualGoal",
      entityId: id,
    });
  },

  async recalculateCompletion(goalId: string) {
    const rocks = await prisma.quarterlyRock.findMany({
      where: { goalId },
      select: { completionPct: true, status: true },
    });

    if (rocks.length === 0) return;

    const avg =
      rocks.reduce((sum, r) => sum + r.completionPct, 0) / rocks.length;

    const allCompleted = rocks.every((r) => r.status === "COMPLETED");
    const anyBlocked = rocks.some((r) => r.status === "BLOCKED" || r.status === "OVERDUE");
    const anyAtRisk = rocks.some(
      (r) => r.status === "OVERDUE" || r.status === "BLOCKED"
    );

    let status: GoalStatus = "ON_TRACK";
    if (allCompleted) status = "COMPLETED";
    else if (anyBlocked) status = "OFF_TRACK";
    else if (anyAtRisk || avg < 50) status = "AT_RISK";

    await prisma.annualGoal.update({
      where: { id: goalId },
      data: {
        completionPct: Math.round(avg * 100) / 100,
        status,
      },
    });
  },
};
