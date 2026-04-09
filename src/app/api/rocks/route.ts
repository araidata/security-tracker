import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { rockService } from "@/lib/services/rock.service";
import { createRockSchema } from "@/lib/validations/rock";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rocks = await rockService.list({
    quarter: searchParams.get("quarter") || undefined,
    fiscalYear: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
    department: searchParams.get("department") || undefined,
    status: searchParams.get("status") || undefined,
    goalId: searchParams.get("goalId") || undefined,
    ownerId: searchParams.get("ownerId") || undefined,
  });

  return NextResponse.json(rocks);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE", "MANAGER"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = createRockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const rock = await rockService.create(parsed.data, session.user.id);
  return NextResponse.json(rock, { status: 201 });
}
