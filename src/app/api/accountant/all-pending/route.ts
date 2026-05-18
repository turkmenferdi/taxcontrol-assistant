import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "accountant") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "review"; // "review" | "risky"

  const accesses = await prisma.companyAccess.findMany({
    where: { userId: session.user.id },
    select: { companyId: true, company: { select: { name: true } } },
  });

  if (accesses.length === 0) return NextResponse.json({ invoices: [], total: 0 });

  const companyIds = accesses.map(a => a.companyId);
  const companyNames: Record<string, string> = Object.fromEntries(
    accesses.map(a => [a.companyId, a.company.name])
  );

  const classificationWhere = type === "risky"
    ? { OR: [{ classification: "non_deductible" }, { classification: "partially_deductible" }] }
    : { classification: "accountant_review_required", accountantFinalDecision: null };

  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: { in: companyIds },
      invoiceDirection: "incoming",
      classification: classificationWhere,
    },
    include: { classification: true },
    orderBy: { invoiceDate: "desc" },
    take: 100,
  });

  const result = invoices.map(inv => ({
    ...inv,
    companyName: companyNames[inv.companyId] ?? "",
  }));

  return NextResponse.json({ invoices: result, total: result.length });
}
