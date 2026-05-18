import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "accountant") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { companyId: true } });
  if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });

  const access = await prisma.companyAccess.findFirst({
    where: { userId: session.user.id, companyId: invoice.companyId },
  });
  if (!access) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  await prisma.expenseClassification.upsert({
    where: { invoiceId: id },
    create: {
      invoiceId: id,
      classification: body.accountantFinalDecision ?? "accountant_review_required",
      accountantFinalDecision: body.accountantFinalDecision,
      accountantNote: body.accountantNote,
    },
    update: {
      accountantFinalDecision: body.accountantFinalDecision,
      accountantNote: body.accountantNote,
    },
  });

  return NextResponse.json({ ok: true });
}
