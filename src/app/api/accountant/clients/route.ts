import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "accountant") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const accesses = await prisma.companyAccess.findMany({
    where: { userId: session.user.id },
    include: {
      company: {
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { invoices: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accesses.map((a) => a.company));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "accountant") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { taxNumber } = await req.json();
  if (!taxNumber) return NextResponse.json({ error: "taxNumber required" }, { status: 400 });

  const company = await prisma.company.findFirst({ where: { taxNumber } });
  if (!company) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 });

  const existing = await prisma.companyAccess.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: company.id } },
  });
  if (existing) return NextResponse.json({ error: "Zaten eklenmiş" }, { status: 409 });

  await prisma.companyAccess.create({ data: { userId: session.user.id, companyId: company.id } });

  return NextResponse.json({ ok: true, company });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "accountant") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { companyId } = await req.json();
  await prisma.companyAccess.deleteMany({
    where: { userId: session.user.id, companyId },
  });

  return NextResponse.json({ ok: true });
}
