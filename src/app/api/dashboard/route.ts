import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardService } from "@/lib/services/dashboard.service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department") || undefined;
  const fiscalYear = searchParams.get("year")
    ? Number(searchParams.get("year"))
    : undefined;

  const [kpis, departmentSummary] = await Promise.all([
    dashboardService.getKPIs({ department, fiscalYear }),
    dashboardService.getDepartmentSummary(fiscalYear),
  ]);

  return NextResponse.json({ ...kpis, departmentSummary });
}
