import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { assignmentService } from "@/lib/services/assignment.service";
import { createAssignmentSchema } from "@/lib/validations/assignment";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const assignments = await assignmentService.list({
    rockId: searchParams.get("rockId") || undefined,
    ownerId: searchParams.get("ownerId") || undefined,
    status: searchParams.get("status") || undefined,
  });

  return NextResponse.json(assignments);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE", "MANAGER"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const assignment = await assignmentService.create(parsed.data, session.user.id);
  return NextResponse.json(assignment, { status: 201 });
}
