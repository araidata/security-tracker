import { z } from "zod/v4";

export const createRockSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  fiscalYear: z.number().int().min(2020).max(2050),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  targetDate: z.string().transform((s) => new Date(s)),
  kpiMetric: z.string().optional(),
  department: z.enum(["SEC_OPS", "SAE", "GRC"]),
  goalId: z.string().min(1),
  ownerId: z.string().min(1),
});

export const updateRockSchema = createRockSchema.partial().extend({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "OVERDUE"]).optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  completionPct: z.number().min(0).max(100).optional(),
  blockers: z.string().optional(),
});

export type CreateRockInput = z.infer<typeof createRockSchema>;
export type UpdateRockInput = z.infer<typeof updateRockSchema>;
