import { z } from "zod/v4";

export const createWeeklyUpdateSchema = z.object({
  rockId: z.string().min(1),
  weekOf: z.string().transform((s) => new Date(s)),
  progressNotes: z.string().min(1),
  blockers: z.string().optional(),
  risks: z.string().optional(),
  decisions: z.string().optional(),
  completionPct: z.number().min(0).max(100),
  confidenceLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
  needsAttention: z.boolean().optional(),
});

export type CreateWeeklyUpdateInput = z.infer<typeof createWeeklyUpdateSchema>;
