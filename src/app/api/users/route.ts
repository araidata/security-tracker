import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/auth";
import { userService } from "@/lib/services/user.service";
import { createUserSchema } from "@/lib/validations/user";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE"]);
  if (roleCheck) return roleCheck;

  const users = await userService.listAdminUsers();

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const user = await userService.create(parsed.data, session.user.id);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }

    throw error;
  }
}
