import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceIds, decision, note } = await req.json() as {
    invoiceIds: string[];
    decision: string;
    note?: string;
  };

  if (!invoiceIds?.length || !decision) {
    return NextResponse.json({ error: "invoiceIds ve decision gerekli" }, { status: 400 });
  }

  // Verify all invoices belong to a company the user has access to
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: invoiceIds } },
    select: { id: true, companyId: true },
  });

  for (const inv of invoices) {
    if (session.user.role === "accountant") {
      const access = await prisma.companyAccess.findUnique({
        where: { userId_companyId: { userId: session.user.id, companyId: inv.companyId } },
      });
      if (!access) return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    } else {
      const company = await prisma.company.findUnique({ where: { userId: session.userId } });
      if (!company || company.id !== inv.companyId) {
        return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
      }
    }
  }

  // Upsert classification for each invoice
  const updated = await Promise.all(
    invoiceIds.map((invoiceId) =>
      prisma.expenseClassification.upsert({
        where: { invoiceId },
        create: {
          invoiceId,
          classification: decision === "non_deductible" || decision === "risky" ? decision : "deductible",
          accountantFinalDecision: decision,
          accountantNote: note,
          confidenceScore: 1,
        },
        update: {
          accountantFinalDecision: decision,
          accountantNote: note,
          updatedAt: new Date(),
        },
      })
    )
  );

  return NextResponse.json({ updated: updated.length });
}
