import { prisma } from "@/lib/prisma";
import type { Department } from "@prisma/client";
import { subDays } from "date-fns";

const NON_ADMIN_DEPT = { not: "ADMIN" as Department };

export const dashboardService = {
  async getKPIs(filters?: { department?: string; fiscalYear?: number }) {
    const deptFilter = filters?.department
      ? { department: filters.department as Department }
      : { department: NON_ADMIN_DEPT };

    const where = {
      ...deptFilter,
      ...(filters?.fiscalYear && { fiscalYear: filters.fiscalYear }),
    };

    const [goals, rocks, attentionItems, recentUpdates, needsAttentionUpdates] =
      await Promise.all([
        prisma.annualGoal.groupBy({ by: ["status"], where, _count: true }),
        prisma.quarterlyRock.groupBy({
          by: ["status"],
          where,
          _count: true,
          _avg: { completionPct: true },
        }),
        prisma.quarterlyRock.findMany({
          where: {
            ...where,
            OR: [
              { status: "BLOCKED" },
              { status: "OVERDUE" },
              { isStale: true },
              { confidence: "LOW" },
            ],
          },
          include: {
            owner: { select: { id: true, name: true } },
            goal: { select: { id: true, title: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        prisma.weeklyUpdate.findMany({
          where: {
            rock: { department: NON_ADMIN_DEPT },
            createdAt: { gte: subDays(new Date(), 14) },
          },
          include: {
            rock: { select: { id: true, title: true } },
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        // rocks with needsAttention=true from recent updates
        prisma.weeklyUpdate.findMany({
          where: {
            needsAttention: true,
            rock: { department: NON_ADMIN_DEPT },
            weekOf: { gte: subDays(new Date(), 30) },
          },
          include: {
            rock: {
              select: {
                id: true,
                title: true,
                status: true,
                owner: { select: { id: true, name: true } },
                goal: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { weekOf: "desc" },
          take: 30,
        }),
      ]);

    // Deduplicate needsAttention by rockId (most recent per rock)
    const seenRocks = new Set<string>();
    const needsAttentionRocks = needsAttentionUpdates
      .filter((u) => {
        if (seenRocks.has(u.rockId)) return false;
        seenRocks.add(u.rockId);
        return true;
      })
      .map((u) => u.rock)
      .slice(0, 15);

    const goalStats = {
      total: goals.reduce((sum, g) => sum + g._count, 0),
      onTrack: goals.find((g) => g.status === "ON_TRACK")?._count || 0,
      atRisk: goals.find((g) => g.status === "AT_RISK")?._count || 0,
      offTrack: goals.find((g) => g.status === "OFF_TRACK")?._count || 0,
      completed: goals.find((g) => g.status === "COMPLETED")?._count || 0,
    };

    const rockTotal = rocks.reduce((sum, r) => sum + r._count, 0);
    const totalCompletion = rocks.reduce(
      (sum, r) => sum + (r._avg.completionPct || 0) * r._count,
      0
    );
    const rockStats = {
      total: rockTotal,
      notStarted: rocks.find((r) => r.status === "NOT_STARTED")?._count || 0,
      inProgress: rocks.find((r) => r.status === "IN_PROGRESS")?._count || 0,
      completed: rocks.find((r) => r.status === "COMPLETED")?._count || 0,
      blocked: rocks.find((r) => r.status === "BLOCKED")?._count || 0,
      overdue: rocks.find((r) => r.status === "OVERDUE")?._count || 0,
      avgCompletion: rockTotal > 0 ? Math.round(totalCompletion / rockTotal) : 0,
    };

    return {
      goalStats,
      rockStats,
      attentionItems,
      recentUpdates,
      needsAttentionRocks,
    };
  },

  async getDepartmentSummary(fiscalYear?: number) {
    // Hardcoded to exclude ADMIN
    const departments: Department[] = ["SEC_OPS", "SAE", "GRC"];
    const summaries = await Promise.all(
      departments.map(async (dept) => {
        const [goals, rocks] = await Promise.all([
          prisma.annualGoal.aggregate({
            where: { department: dept, ...(fiscalYear && { fiscalYear }) },
            _count: true,
            _avg: { completionPct: true },
          }),
          prisma.quarterlyRock.aggregate({
            where: { department: dept, ...(fiscalYear && { fiscalYear }) },
            _count: true,
            _avg: { completionPct: true },
          }),
        ]);
        return {
          department: dept,
          goalCount: goals._count,
          goalAvgCompletion: Math.round(goals._avg.completionPct || 0),
          rockCount: rocks._count,
          rockAvgCompletion: Math.round(rocks._avg.completionPct || 0),
        };
      })
    );
    return summaries;
  },
};
