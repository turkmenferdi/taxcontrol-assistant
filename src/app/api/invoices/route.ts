import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ invoices: [] });

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const classification = searchParams.get("classification");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = { companyId: company.id };
  if (direction) where.invoiceDirection = direction;
  if (startDate || endDate) {
    where.invoiceDate = {};
    if (startDate) (where.invoiceDate as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.invoiceDate as Record<string, unknown>).lte = new Date(endDate);
  }

  const classificationFilter = classification
    ? {
        classification: {
          some: {
            OR: [
              { classification: classification },
              { accountantFinalDecision: classification },
            ],
          },
        },
      }
    : {};

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { classification: true, lines: true },
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit });
}
