import { z } from "zod/v4";

export const createMonthlyReviewSchema = z.object({
  goalId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  fiscalYear: z.number().int().min(2020).max(2050),
  summary: z.string().min(1),
  highlights: z.string().optional(),
  concerns: z.string().optional(),
  leadershipNotes: z.string().optional(),
  overallStatus: z.enum(["ON_TRACK", "AT_RISK", "OFF_TRACK", "COMPLETED"]),
});

export const createQuarterlyReviewSchema = z.object({
  goalId: z.string().min(1),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  fiscalYear: z.number().int().min(2020).max(2050),
  plannedOutcomes: z.string().min(1),
  actualOutcomes: z.string().min(1),
  lessonsLearned: z.string().optional(),
  adjustments: z.string().optional(),
  overallStatus: z.enum(["ON_TRACK", "AT_RISK", "OFF_TRACK", "COMPLETED"]),
});

export type CreateMonthlyReviewInput = z.infer<typeof createMonthlyReviewSchema>;
export type CreateQuarterlyReviewInput = z.infer<typeof createQuarterlyReviewSchema>;
