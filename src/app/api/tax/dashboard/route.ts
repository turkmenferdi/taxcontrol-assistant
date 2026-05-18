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
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const { startDate: qStart, endDate: qEnd } = getQuarterDates(now.getFullYear(), quarter);

  const [vat, provisional, outgoingCount, incomingCount, prevOutgoingCount, prevIncomingCount, riskyCount, reviewCount, deductibleCount, totalClassified] =
    await Promise.all([
      calculateVatSummary(company.id, monthStart, monthEnd),
      calculateProvisionalTax(company.id, company.companyType, qStart, qEnd),
      prisma.invoice.count({ where: { companyId: company.id, invoiceDirection: "outgoing", invoiceDate: { gte: monthStart, lte: monthEnd } } }),
      prisma.invoice.count({ where: { companyId: company.id, invoiceDirection: "incoming", invoiceDate: { gte: monthStart, lte: monthEnd } } }),
      prisma.invoice.count({ where: { companyId: company.id, invoiceDirection: "outgoing", invoiceDate: { gte: prevMonthStart, lte: prevMonthEnd } } }),
      prisma.invoice.count({ where: { companyId: company.id, invoiceDirection: "incoming", invoiceDate: { gte: prevMonthStart, lte: prevMonthEnd } } }),
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
          classification: "accountant_review_required",
          accountantFinalDecision: null,
        },
      }),
      prisma.expenseClassification.count({
        where: {
          invoice: { companyId: company.id },
          OR: [
            { accountantFinalDecision: "deductible" },
            { AND: [{ classification: "deductible" }, { accountantFinalDecision: null }] },
          ],
        },
      }),
      prisma.expenseClassification.count({
        where: { invoice: { companyId: company.id } },
      }),
    ]);

  const trend = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  return NextResponse.json({
    vat,
    provisional,
    outgoingCount,
    incomingCount,
    riskyCount,
    reviewCount,
    deductibleCount,
    totalClassified,
    trends: {
      outgoing: trend(outgoingCount, prevOutgoingCount),
      incoming: trend(incomingCount, prevIncomingCount),
    },
    period: { monthStart, monthEnd, quarter, year: now.getFullYear() },
  });
}
