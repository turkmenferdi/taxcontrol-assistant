import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "accountant") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { invoiceIds, decision } = await req.json();
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    return NextResponse.json({ error: "Fatura seçilmedi" }, { status: 400 });
  }

  const accesses = await prisma.companyAccess.findMany({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  const allowedCompanyIds = new Set(accesses.map((a) => a.companyId));

  const invoices = await prisma.invoice.findMany({
    where: { id: { in: invoiceIds } },
    select: { id: true, companyId: true },
  });

  const unauthorized = invoices.filter((inv) => !allowedCompanyIds.has(inv.companyId));
  if (unauthorized.length > 0) {
    return NextResponse.json({ error: "Yetkisiz fatura" }, { status: 403 });
  }

  await prisma.$transaction(
    invoices.map((inv) =>
      prisma.expenseClassification.upsert({
        where: { invoiceId: inv.id },
        create: {
          invoiceId: inv.id,
          classification: decision ?? "accountant_review_required",
          accountantFinalDecision: decision,
        },
        update: { accountantFinalDecision: decision },
      })
    )
  );

  return NextResponse.json({ ok: true, updated: invoices.length });
}
