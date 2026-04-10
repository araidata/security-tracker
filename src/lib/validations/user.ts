import { z } from "zod/v4";

const roleSchema = z.enum(["EXECUTIVE", "MANAGER", "CONTRIBUTOR"]);
const departmentSchema = z.enum(["SEC_OPS", "SAE", "GRC"]);

const baseUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  role: roleSchema,
  department: departmentSchema,
});

const passwordSchema = z.string().min(8).max(72);

export const createUserSchema = baseUserSchema.extend({
  password: passwordSchema,
});

export const updateUserSchema = baseUserSchema.extend({
  password: z.union([passwordSchema, z.literal("")]).optional(),
}).transform(({ password, ...rest }) => ({
  ...rest,
  password: password || undefined,
}));

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
