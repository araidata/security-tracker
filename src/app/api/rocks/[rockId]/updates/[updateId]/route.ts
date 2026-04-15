import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateService } from "@/lib/services/update.service";
import { updateWeeklyUpdateSchema } from "@/lib/validations/update";

export async function GET(
  _request: Request,
  { params }: { params: { rockId: string; updateId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const update = await updateService.getById(params.updateId);
  if (!update || update.rock.id !== params.rockId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(update);
}

export async function PUT(
  request: Request,
  { params }: { params: { rockId: string; updateId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateWeeklyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateService.update(params.updateId, parsed.data, session.user.id);
  return NextResponse.json(updated);
}
