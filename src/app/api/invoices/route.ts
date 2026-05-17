import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedCompanyId = searchParams.get("companyId");

  let companyId: string;

  if (requestedCompanyId && session.user.role === "accountant") {
    const access = await prisma.companyAccess.findUnique({
      where: { userId_companyId: { userId: session.user.id, companyId: requestedCompanyId } },
    });
    if (!access) return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    companyId = requestedCompanyId;
  } else {
    const company = await prisma.company.findUnique({ where: { userId: session.userId } });
    if (!company) return NextResponse.json({ invoices: [] });
    companyId = company.id;
  }

  const direction = searchParams.get("direction");
  const classification = searchParams.get("classification");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = { companyId };
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
