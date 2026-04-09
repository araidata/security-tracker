import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assignmentService } from "@/lib/services/assignment.service";
import { updateAssignmentSchema } from "@/lib/validations/assignment";

export async function GET(
  request: Request,
  { params }: { params: { assignmentId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignment = await assignmentService.getById(params.assignmentId);
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(assignment);
}

export async function PUT(
  request: Request,
  { params }: { params: { assignmentId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const assignment = await assignmentService.update(
    params.assignmentId,
    parsed.data,
    session.user.id
  );
  return NextResponse.json(assignment);
}
