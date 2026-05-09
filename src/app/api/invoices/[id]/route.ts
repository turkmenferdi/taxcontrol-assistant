import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: company.id },
    include: { classification: true, lines: true },
  });
  if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });

  return NextResponse.json({ invoice });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: company.id },
  });
  if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });

  // Update classification (accountant review)
  if (body.accountantFinalDecision !== undefined || body.accountantNote !== undefined) {
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
  }

  const updated = await prisma.invoice.findFirst({
    where: { id },
    include: { classification: true, lines: true },
  });

  return NextResponse.json({ invoice: updated });
}
