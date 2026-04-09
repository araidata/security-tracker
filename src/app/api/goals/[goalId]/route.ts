import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { goalService } from "@/lib/services/goal.service";
import { updateGoalSchema } from "@/lib/validations/goal";

export async function GET(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await goalService.getById(params.goalId);
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(goal);
}

export async function PUT(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE", "MANAGER"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const goal = await goalService.update(params.goalId, parsed.data, session.user.id);
  return NextResponse.json(goal);
}

export async function DELETE(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE"]);
  if (roleCheck) return roleCheck;

  await goalService.delete(params.goalId, session.user.id);
  return NextResponse.json({ success: true });
}
