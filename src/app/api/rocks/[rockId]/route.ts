import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { rockService, RockDeleteError } from "@/lib/services/rock.service";
import { updateRockSchema } from "@/lib/validations/rock";

export async function GET(
  request: Request,
  { params }: { params: { rockId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rock = await rockService.getById(params.rockId);
  if (!rock) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(rock);
}

export async function PUT(
  request: Request,
  { params }: { params: { rockId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE", "MANAGER"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = updateRockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const rock = await rockService.update(params.rockId, parsed.data, session.user.id);
  return NextResponse.json(rock);
}

export async function DELETE(
  request: Request,
  { params }: { params: { rockId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE", "MANAGER"]);
  if (roleCheck) return roleCheck;

  try {
    await rockService.delete(params.rockId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RockDeleteError) {
      if (error.code === "NOT_FOUND") {
        return NextResponse.json({ error: "Rock not found." }, { status: 404 });
      }

      if (error.code === "DEPENDENCY_CONFLICT") {
        return NextResponse.json(
          {
            error:
              "This rock still has linked records that must be removed before it can be deleted.",
          },
          { status: 409 }
        );
      }
    }

    throw error;
  }
}
