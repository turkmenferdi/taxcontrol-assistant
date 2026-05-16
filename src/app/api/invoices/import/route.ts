import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseInvoiceFile } from "@/lib/invoice-parser";
import { classifyExpense } from "@/services/expense-classification.service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const company = session.user.company;
  if (!company) return Response.json({ error: "Firma bulunamadı" }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const direction = (formData.get("direction") as string) || "incoming";

  if (!file) return Response.json({ error: "Dosya bulunamadı" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const { rows, warnings } = parseInvoiceFile(buffer);

  if (rows.length === 0) {
    return Response.json({ error: "Dosyadan fatura okunamadı. Sütun başlıklarını kontrol edin.", warnings }, { status: 422 });
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      // Skip if no date and no amount
      if (!row.invoiceDate && !row.grossAmount) { skipped++; continue; }

      const invoiceDate = row.invoiceDate ?? new Date();
      const netAmount = row.netAmount ?? (row.grossAmount ? row.grossAmount * (1 / 1.2) : 0);
      const vatAmount = row.vatAmount ?? (row.grossAmount ? row.grossAmount - netAmount : 0);
      const grossAmount = row.grossAmount ?? netAmount + vatAmount;

      // Deduplicate by invoice number + company
      if (row.invoiceNumber) {
        const exists = await prisma.invoice.findFirst({
          where: { companyId: company.id, invoiceNumber: row.invoiceNumber },
        });
        if (exists) { skipped++; continue; }
      }

      const supplierName = direction === "incoming" ? (row.supplierName ?? "") : company.name;
      const customerName = direction === "outgoing" ? (row.customerName ?? "") : company.name;

      const inv = await prisma.invoice.create({
        data: {
          companyId: company.id,
          providerName: "import",
          invoiceDirection: direction,
          invoiceType: (row.invoiceType as "eInvoice" | "eArchive") ?? "eInvoice",
          invoiceNumber: row.invoiceNumber,
          ettn: row.ettn,
          invoiceDate,
          supplierName,
          supplierTaxNumber: row.supplierTaxNumber,
          customerName,
          customerTaxNumber: row.customerTaxNumber,
          currency: "TRY",
          netAmount,
          vatAmount,
          grossAmount,
        },
      });

      // Auto-classify incoming invoices
      if (direction === "incoming") {
        const result = classifyExpense(supplierName, row.invoiceNumber ?? "", []);
        await prisma.expenseClassification.create({
          data: {
            invoiceId: inv.id,
            category: result.category,
            classification: result.classification,
            confidenceScore: result.confidenceScore,
            reason: result.reason,
          },
        });
      }

      created++;
    } catch {
      errors++;
    }
  }

  return Response.json({ created, skipped, errors, warnings, total: rows.length });
}
