import { z } from "zod/v4";

export const createAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  rockId: z.string().min(1),
  ownerId: z.string().min(1),
  contributorIds: z.array(z.string()).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
