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

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      label: d.toLocaleString("tr-TR", { month: "short", year: "2-digit" }),
    };
  });

  const data = await Promise.all(
    months.map(async (m) => {
      const [inc, out] = await Promise.all([
        prisma.invoice.aggregate({
          where: { companyId, invoiceDirection: "incoming", invoiceDate: { gte: m.start, lte: m.end } },
          _sum: { netAmount: true, vatAmount: true },
          _count: true,
        }),
        prisma.invoice.aggregate({
          where: { companyId, invoiceDirection: "outgoing", invoiceDate: { gte: m.start, lte: m.end } },
          _sum: { netAmount: true, vatAmount: true },
          _count: true,
        }),
      ]);
      return {
        label: m.label,
        incomingNet: inc._sum.netAmount ?? 0,
        incomingVat: inc._sum.vatAmount ?? 0,
        incomingCount: inc._count,
        outgoingNet: out._sum.netAmount ?? 0,
        outgoingVat: out._sum.vatAmount ?? 0,
        outgoingCount: out._count,
        netVat: (out._sum.vatAmount ?? 0) - (inc._sum.vatAmount ?? 0),
      };
    })
  );

  return NextResponse.json({ months: data });
}
