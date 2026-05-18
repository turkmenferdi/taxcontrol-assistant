import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "accountant") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const accesses = await prisma.companyAccess.findMany({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  const companyIds = accesses.map((a) => a.companyId);

  if (companyIds.length === 0) {
    return NextResponse.json({ clients: [], totalCompanies: 0, totalInvoices: 0 });
  }

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const summaries = await Promise.all(
    companyIds.map(async (companyId) => {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { user: { select: { name: true, email: true } } },
      });

      const [incomingCount, outgoingCount, thisMonthIncoming, thisMonthOutgoing] = await Promise.all([
        prisma.invoice.count({ where: { companyId, invoiceDirection: "incoming" } }),
        prisma.invoice.count({ where: { companyId, invoiceDirection: "outgoing" } }),
        prisma.invoice.aggregate({
          where: { companyId, invoiceDirection: "incoming", invoiceDate: { gte: firstOfMonth } },
          _sum: { vatAmount: true, netAmount: true },
          _count: true,
        }),
        prisma.invoice.aggregate({
          where: { companyId, invoiceDirection: "outgoing", invoiceDate: { gte: firstOfMonth } },
          _sum: { vatAmount: true, netAmount: true },
          _count: true,
        }),
      ]);

      const [riskyInvoices, pendingReviewCount] = await Promise.all([
        prisma.expenseClassification.count({
          where: {
            invoice: { companyId },
            OR: [{ classification: "non_deductible" }, { classification: "partially_deductible" }],
          },
        }),
        prisma.expenseClassification.count({
          where: {
            invoice: { companyId },
            classification: "accountant_review_required",
            accountantFinalDecision: null,
          },
        }),
      ]);

      return {
        company,
        incomingCount,
        outgoingCount,
        thisMonthIncoming: {
          count: thisMonthIncoming._count,
          netAmount: thisMonthIncoming._sum.netAmount ?? 0,
          vatAmount: thisMonthIncoming._sum.vatAmount ?? 0,
        },
        thisMonthOutgoing: {
          count: thisMonthOutgoing._count,
          netAmount: thisMonthOutgoing._sum.netAmount ?? 0,
          vatAmount: thisMonthOutgoing._sum.vatAmount ?? 0,
        },
        riskyInvoices,
        pendingReviewCount,
      };
    })
  );

  return NextResponse.json({
    clients: summaries,
    totalCompanies: companyIds.length,
    totalInvoices: summaries.reduce((s, c) => s + c.incomingCount + c.outgoingCount, 0),
  });
}
