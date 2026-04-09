import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/auth";
import { goalService } from "@/lib/services/goal.service";
import { createGoalSchema } from "@/lib/validations/goal";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const goals = await goalService.list({
    fiscalYear: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
    department: searchParams.get("department") || undefined,
    status: searchParams.get("status") || undefined,
    ownerId: searchParams.get("ownerId") || undefined,
  });

  return NextResponse.json(goals);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE", "MANAGER"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const goal = await goalService.create(parsed.data, session.user.id);
  return NextResponse.json(goal, { status: 201 });
}
