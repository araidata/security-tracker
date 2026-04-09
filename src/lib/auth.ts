import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-options";
import type { Role } from "@/generated/prisma";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function requireRole(
  userRole: Role,
  allowedRoles: Role[]
): NextResponse | null {
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function canEdit(userRole: Role): boolean {
  return userRole === "EXECUTIVE" || userRole === "MANAGER";
}

export function isExecutive(userRole: Role): boolean {
  return userRole === "EXECUTIVE";
}
