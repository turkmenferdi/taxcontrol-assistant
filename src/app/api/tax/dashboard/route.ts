import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateVatSummary, calculateProvisionalTax } from "@/services/tax-calculation.service";
import { getQuarterDates } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const { startDate: qStart, endDate: qEnd } = getQuarterDates(now.getFullYear(), quarter);

  const [vat, provisional, outgoingCount, incomingCount, riskyCount, reviewCount] =
    await Promise.all([
      calculateVatSummary(company.id, monthStart, monthEnd),
      calculateProvisionalTax(company.id, company.companyType, qStart, qEnd),
      prisma.invoice.count({ where: { companyId: company.id, invoiceDirection: "outgoing", invoiceDate: { gte: monthStart, lte: monthEnd } } }),
      prisma.invoice.count({ where: { companyId: company.id, invoiceDirection: "incoming", invoiceDate: { gte: monthStart, lte: monthEnd } } }),
      prisma.expenseClassification.count({
        where: {
          invoice: { companyId: company.id },
          OR: [{ classification: "non_deductible" }, { classification: "partially_deductible" }],
          accountantFinalDecision: null,
        },
      }),
      prisma.expenseClassification.count({
        where: {
          invoice: { companyId: company.id },
          OR: [{ classification: "accountant_review_required" }],
          accountantFinalDecision: null,
        },
      }),
    ]);

  return NextResponse.json({
    vat,
    provisional,
    outgoingCount,
    incomingCount,
    riskyCount,
    reviewCount,
    period: { monthStart, monthEnd, quarter, year: now.getFullYear() },
  });
}
