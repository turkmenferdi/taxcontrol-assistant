import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateVatSummary, calculateProvisionalTax } from "@/services/tax-calculation.service";
import { getQuarterDates, classificationLabel, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

const DISCLAIMER =
  "Bu rapor tahmini bir ön-kontrol raporudur. Kesin vergi muamelesi ve beyan sorumluluğu mükellef ve sertifikalı muhasebeciye aittir.";

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { userId: session.userId } });
  if (!company) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  const { type } = await params;
  const { searchParams } = new URL(req.url);

  if (type === "invoices") {
    const direction = searchParams.get("direction") ?? "incoming";
    const month = searchParams.get("month");
    let startDate: Date, endDate: Date;
    if (month) {
      const [y, m] = month.split("-").map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const invoices = await prisma.invoice.findMany({
      where: { companyId: company.id, invoiceDirection: direction, invoiceDate: { gte: startDate, lte: endDate } },
      include: { classification: true },
      orderBy: { invoiceDate: "asc" },
    });

    const rows = [
      ["TaxControl - Fatura Listesi", "", "", "", "", "", "", "", DISCLAIMER],
      ["Firma:", company.name, "", "Dönem:", `${formatDate(startDate)} - ${formatDate(endDate)}`],
      [],
      ["Tarih", "Fatura No", "Tedarikçi/Müşteri", "Net Tutar", "KDV", "Brüt Tutar", "Sınıflandırma", "Muhasebeci Kararı", "Not"],
      ...invoices.map((i: typeof invoices[0]) => [
        formatDate(i.invoiceDate),
        i.invoiceNumber ?? "",
        direction === "incoming" ? i.supplierName : i.customerName,
        i.netAmount,
        i.vatAmount,
        i.grossAmount,
        classificationLabel(i.classification?.classification ?? ""),
        classificationLabel(i.classification?.accountantFinalDecision ?? ""),
        i.classification?.accountantNote ?? "",
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Faturalar");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=faturalar_${direction}_${month ?? "tum"}.xlsx`,
      },
    });
  }

  if (type === "vat-summary") {
    const month = searchParams.get("month");
    let startDate: Date, endDate: Date;
    if (month) {
      const [y, m] = month.split("-").map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const vat = await calculateVatSummary(company.id, startDate, endDate);

    const rows = [
      ["TaxControl - KDV Özeti", "", DISCLAIMER],
      ["Firma:", company.name],
      ["Dönem:", `${formatDate(startDate)} - ${formatDate(endDate)}`],
      [],
      ["AÇIKLAMA", "TUTAR (TRY)"],
      ["Satış Matrahı (Net)", vat.outgoingNetTotal],
      ["Hesaplanan KDV (Satışlardan)", vat.outgoingVatTotal],
      ["Alış Matrahı (Net)", vat.incomingNetTotal],
      ["İndirilecek KDV (Alışlardan)", vat.deductibleVatTotal],
      ["İndirilemeyen KDV", vat.nonDeductibleVatTotal],
      ["TAHMİNİ ÖDENECEK KDV", vat.estimatedPayableVat],
      ["TAHMİNİ DEVREDEN KDV", vat.estimatedCarryForwardVat],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "KDV Özeti");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=kdv_ozeti_${month ?? "donem"}.xlsx`,
      },
    });
  }

  if (type === "provisional-tax") {
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const quarter = parseInt(searchParams.get("quarter") ?? "1");
    const { startDate, endDate } = getQuarterDates(year, quarter);
    const pt = await calculateProvisionalTax(company.id, company.companyType, startDate, endDate);

    const rows = [
      ["TaxControl - Geçici Vergi Tahmini", "", DISCLAIMER],
      ["Firma:", company.name],
      ["Dönem:", `${year} Yılı ${quarter}. Çeyrek`],
      [],
      ["AÇIKLAMA", "TUTAR (TRY)"],
      ["Toplam Ciro (Net Satış)", pt.revenue],
      ["İndirilebilir Giderler", pt.deductibleExpenses],
      ["TAHMİNİ KÂR (Matrah)", pt.estimatedProfit],
      [`Geçici Vergi Oranı (%${(pt.taxRate * 100).toFixed(0)})`, pt.taxRate],
      ["TAHMİNİ GEÇİCİ VERGİ", pt.estimatedProvisionalTax],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Geçici Vergi");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=gecici_vergi_${year}_q${quarter}.xlsx`,
      },
    });
  }

  return NextResponse.json({ error: "Bilinmeyen rapor tipi" }, { status: 400 });
}
