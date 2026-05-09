import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const company = await prisma.company.findUnique({
    where: { userId: session.userId },
  });
  return NextResponse.json({ company });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.company.findUnique({ where: { userId: session.userId } });

  const data = {
    userId: session.userId,
    name: body.name,
    taxNumber: body.taxNumber,
    taxOffice: body.taxOffice,
    companyType: body.companyType ?? "sole_proprietorship",
    vatPeriod: body.vatPeriod ?? "monthly",
    providerName: body.providerName,
    providerConfig: body.providerConfig ? JSON.stringify(body.providerConfig) : undefined,
  };

  const company = existing
    ? await prisma.company.update({ where: { userId: session.userId }, data })
    : await prisma.company.create({ data });

  return NextResponse.json({ company });
}
