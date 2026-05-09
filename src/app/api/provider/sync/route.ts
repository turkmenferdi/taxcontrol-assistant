import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncInvoices } from "@/services/invoice-sync.service";
import { ProviderName } from "@/providers/provider-factory";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const body = await req.json();
  const now = new Date();
  const startDate = body.startDate
    ? new Date(body.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = body.endDate ? new Date(body.endDate) : now;

  const providerName = (company.providerName ?? "mock") as ProviderName;
  const providerConfig = company.providerConfig
    ? JSON.parse(company.providerConfig)
    : {};

  try {
    const result = await syncInvoices(
      company.id,
      providerName,
      providerConfig,
      startDate,
      endDate
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Senkronizasyon hatası" },
      { status: 500 }
    );
  }
}
