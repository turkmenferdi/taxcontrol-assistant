import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "accountant") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const access = await prisma.companyAccess.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  });
  if (!access) return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const quarterStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59);

  const [
    allIncoming,
    allOutgoing,
    monthIncoming,
    monthOutgoing,
    quarterOutgoing,
    quarterIncoming,
    riskyCount,
    reviewCount,
  ] = await Promise.all([
    prisma.invoice.count({ where: { companyId, invoiceDirection: "incoming" } }),
    prisma.invoice.count({ where: { companyId, invoiceDirection: "outgoing" } }),
    prisma.invoice.aggregate({
      where: { companyId, invoiceDirection: "incoming", invoiceDate: { gte: monthStart, lte: monthEnd } },
      _sum: { netAmount: true, vatAmount: true, grossAmount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { companyId, invoiceDirection: "outgoing", invoiceDate: { gte: monthStart, lte: monthEnd } },
      _sum: { netAmount: true, vatAmount: true, grossAmount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { companyId, invoiceDirection: "outgoing", invoiceDate: { gte: quarterStart, lte: quarterEnd } },
      _sum: { netAmount: true, vatAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { companyId, invoiceDirection: "incoming", invoiceDate: { gte: quarterStart, lte: quarterEnd } },
      _sum: { netAmount: true, vatAmount: true },
    }),
    prisma.expenseClassification.count({
      where: {
        invoice: { companyId },
        OR: [{ classification: "risky" }, { accountantFinalDecision: "non_deductible" }],
      },
    }),
    prisma.expenseClassification.count({
      where: {
        invoice: { companyId },
        classification: "needs_review",
        accountantFinalDecision: null,
      },
    }),
  ]);

  const outVat = monthOutgoing._sum.vatAmount ?? 0;
  const inVat = monthIncoming._sum.vatAmount ?? 0;
  const payableVat = Math.max(0, outVat - inVat);
  const carryForwardVat = Math.max(0, inVat - outVat);

  const quarterOutNet = quarterOutgoing._sum.netAmount ?? 0;
  const quarterInNet = quarterIncoming._sum.netAmount ?? 0;
  const estimatedProfit = Math.max(0, quarterOutNet - quarterInNet);
  const taxRate = company.companyType === "limited" ? 0.25 : 0.15;
  const provisionalTax = estimatedProfit * taxRate;

  return NextResponse.json({
    company,
    stats: {
      allIncoming,
      allOutgoing,
      riskyCount,
      reviewCount,
      month: {
        incoming: { count: monthIncoming._count, net: monthIncoming._sum.netAmount ?? 0, vat: inVat, gross: monthIncoming._sum.grossAmount ?? 0 },
        outgoing: { count: monthOutgoing._count, net: monthOutgoing._sum.netAmount ?? 0, vat: outVat, gross: monthOutgoing._sum.grossAmount ?? 0 },
        calculatedVat: outVat,
        deductibleVat: inVat,
        payableVat,
        carryForwardVat,
      },
      quarter: {
        number: quarter,
        year: now.getFullYear(),
        outgoingNet: quarterOutNet,
        incomingNet: quarterInNet,
        estimatedProfit,
        taxRate,
        provisionalTax,
      },
    },
  });
}
