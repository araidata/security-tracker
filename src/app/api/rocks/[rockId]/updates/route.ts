import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateService } from "@/lib/services/update.service";
import { createWeeklyUpdateSchema } from "@/lib/validations/update";

export async function GET(
  request: Request,
  { params }: { params: { rockId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await updateService.listByRock(params.rockId);
  return NextResponse.json(updates);
}

export async function POST(
  request: Request,
  { params }: { params: { rockId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createWeeklyUpdateSchema.safeParse({
    ...body,
    rockId: params.rockId,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const update = await updateService.create(parsed.data, session.user.id);
  return NextResponse.json(update, { status: 201 });
}
