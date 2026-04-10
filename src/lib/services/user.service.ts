import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit.service";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";

export class UserManagementError extends Error {
  constructor(public code: "NOT_FOUND" | "LAST_EXECUTIVE") {
    super(code);
  }
}

export const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  createdAt: true,
  _count: {
    select: {
      ownedGoals: true,
      ownedRocks: true,
      assignments: true,
    },
  },
} satisfies Prisma.UserSelect;

export type AdminUserRecord = Prisma.UserGetPayload<{
  select: typeof adminUserSelect;
}>;

export const userService = {
  async listAdminUsers() {
    return prisma.user.findMany({
      select: adminUserSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  },

  async create(data: CreateUserInput, actorId: string) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        passwordHash,
      },
      select: adminUserSelect,
    });

    await createAuditLog({
      userId: actorId,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      changes: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });

    return user;
  },

  async update(id: string, data: UpdateUserInput, actorId: string) {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    if (!existing) {
      throw new UserManagementError("NOT_FOUND");
    }

    if (existing.role === "EXECUTIVE" && data.role !== "EXECUTIVE") {
      const executiveCount = await prisma.user.count({
        where: { role: "EXECUTIVE" },
      });

      if (executiveCount <= 1) {
        throw new UserManagementError("LAST_EXECUTIVE");
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        ...(data.password
          ? { passwordHash: await bcrypt.hash(data.password, 12) }
          : {}),
      },
      select: adminUserSelect,
    });

    await createAuditLog({
      userId: actorId,
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      changes: {
        before: existing,
        after: {
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          passwordChanged: Boolean(data.password),
        },
      },
    });

    return user;
  },
};
