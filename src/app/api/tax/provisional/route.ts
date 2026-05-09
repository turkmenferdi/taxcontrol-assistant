import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProvisionalTax } from "@/services/tax-calculation.service";
import { getQuarterDates } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const quarter = parseInt(searchParams.get("quarter") ?? String(Math.floor(now.getMonth() / 3) + 1));

  const { startDate, endDate } = getQuarterDates(year, quarter);

  const summary = await calculateProvisionalTax(
    company.id,
    company.companyType,
    startDate,
    endDate
  );

  return NextResponse.json({ summary, year, quarter, startDate, endDate });
}
