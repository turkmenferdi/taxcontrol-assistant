import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "accountant") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { companyId } = await params;
  const { note } = await req.json();

  const access = await prisma.companyAccess.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  });
  if (!access) return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });

  const updated = await prisma.companyAccess.update({
    where: { userId_companyId: { userId: session.user.id, companyId } },
    data: { note: note || null },
  });

  return NextResponse.json({ ok: true, note: updated.note });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "accountant") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { companyId } = await params;
  const access = await prisma.companyAccess.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  });
  if (!access) return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });

  return NextResponse.json({ note: access.note ?? "" });
}
