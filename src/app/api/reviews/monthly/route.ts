import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { reviewService } from "@/lib/services/review.service";
import { createMonthlyReviewSchema } from "@/lib/validations/review";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const reviews = await reviewService.listMonthly({
    fiscalYear: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
    goalId: searchParams.get("goalId") || undefined,
  });

  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = requireRole(session.user.role, ["EXECUTIVE", "MANAGER"]);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const parsed = createMonthlyReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const review = await reviewService.createMonthly(parsed.data, session.user.id);
  return NextResponse.json(review, { status: 201 });
}
