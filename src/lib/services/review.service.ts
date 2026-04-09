import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit.service";
import type { CreateMonthlyReviewInput, CreateQuarterlyReviewInput } from "@/lib/validations/review";
import type { Quarter } from "@prisma/client";

export const reviewService = {
  async listMonthly(filters?: { fiscalYear?: number; goalId?: string }) {
    return prisma.monthlyReview.findMany({
      where: {
        ...(filters?.fiscalYear && { fiscalYear: filters.fiscalYear }),
        ...(filters?.goalId && { goalId: filters.goalId }),
      },
      include: {
        goal: { select: { id: true, title: true, department: true } },
      },
      orderBy: [{ fiscalYear: "desc" }, { month: "desc" }],
    });
  },

  async listQuarterly(filters?: { fiscalYear?: number; goalId?: string }) {
    return prisma.quarterlyReview.findMany({
      where: {
        ...(filters?.fiscalYear && { fiscalYear: filters.fiscalYear }),
        ...(filters?.goalId && { goalId: filters.goalId }),
      },
      include: {
        goal: { select: { id: true, title: true, department: true } },
        rocks: {
          include: { rock: { select: { id: true, title: true } } },
        },
      },
      orderBy: [{ fiscalYear: "desc" }, { quarter: "desc" }],
    });
  },

  async createMonthly(data: CreateMonthlyReviewInput, userId: string) {
    const review = await prisma.monthlyReview.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entityType: "MonthlyReview",
      entityId: review.id,
      changes: data as unknown as Record<string, unknown>,
    });

    return review;
  },

  async createQuarterly(data: CreateQuarterlyReviewInput, userId: string) {
    const review = await prisma.quarterlyReview.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Create rock snapshots
    const rocks = await prisma.quarterlyRock.findMany({
      where: {
        goalId: data.goalId,
        quarter: data.quarter as Quarter,
        fiscalYear: data.fiscalYear,
      },
    });

    if (rocks.length > 0) {
      await prisma.quarterlyReviewRock.createMany({
        data: rocks.map((rock) => ({
          quarterlyReviewId: review.id,
          rockId: rock.id,
          plannedCompletion: 100,
          actualCompletion: rock.completionPct,
          statusAtReview: rock.status,
        })),
      });
    }

    await createAuditLog({
      userId,
      action: "CREATE",
      entityType: "QuarterlyReview",
      entityId: review.id,
      changes: data as unknown as Record<string, unknown>,
    });

    return review;
  },
};
