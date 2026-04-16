import { z } from "zod/v4";

export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  fiscalYear: z.number().int().min(2020).max(2050),
  department: z.enum(["SEC_OPS", "SAE", "GRC", "ADMIN"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  targetDate: z.string().transform((s) => new Date(s)),
  metrics: z.string().optional(),
  ownerId: z.string().min(1),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(["ON_TRACK", "AT_RISK", "OFF_TRACK", "COMPLETED"]).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
