import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateVatSummary } from "@/services/tax-calculation.service";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const startDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate")!)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = searchParams.get("endDate")
    ? new Date(searchParams.get("endDate")!)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const summary = await calculateVatSummary(company.id, startDate, endDate);
  return NextResponse.json({ summary, startDate, endDate });
}
