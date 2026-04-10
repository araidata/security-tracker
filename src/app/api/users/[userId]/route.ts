import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession, requireRole } from "@/lib/auth";
import { userService, UserManagementError } from "@/lib/services/user.service";
import { updateUserSchema } from "@/lib/validations/user";

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const user = await userService.update(
      params.userId,
      parsed.data,
      session.user.id
    );

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof UserManagementError) {
      if (error.code === "NOT_FOUND") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (error.code === "LAST_EXECUTIVE") {
        return NextResponse.json(
          { error: "At least one executive account must remain." },
          { status: 400 }
        );
      }
    }

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
