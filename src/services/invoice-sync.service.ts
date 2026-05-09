import { prisma } from "@/lib/prisma";
import { createProvider, ProviderName } from "@/providers/provider-factory";
import { classifyExpense } from "./expense-classification.service";

export async function syncInvoices(
  companyId: string,
  providerName: ProviderName,
  providerConfig: Record<string, unknown>,
  startDate: Date,
  endDate: Date
) {
  const provider = createProvider(providerName, providerConfig as never);
  await provider.loginToProvider();

  const [incoming, outgoing, eArchive] = await Promise.all([
    provider.getIncomingInvoices(startDate, endDate),
    provider.getOutgoingInvoices(startDate, endDate),
    provider.getEArchiveInvoices(startDate, endDate),
  ]);

  let created = 0;
  let skipped = 0;

  const allInvoices = [
    ...incoming.map((i) => ({ ...i, direction: "incoming" as const })),
    ...outgoing.map((i) => ({ ...i, direction: "outgoing" as const })),
    ...eArchive.map((i) => ({ ...i, direction: "outgoing" as const, invoiceType: "eArchive" as const })),
  ];

  for (const inv of allInvoices) {
    const exists = await prisma.invoice.findFirst({
      where: {
        companyId,
        invoiceNumber: inv.invoiceNumber,
        invoiceDirection: inv.direction,
      },
    });

    if (exists) { skipped++; continue; }

    const dbInvoice = await prisma.invoice.create({
      data: {
        companyId,
        providerName,
        invoiceDirection: inv.direction,
        invoiceType: inv.invoiceType,
        invoiceNumber: inv.invoiceNumber,
        ettn: inv.ettn,
        invoiceDate: inv.invoiceDate,
        supplierName: inv.supplierName,
        supplierTaxNumber: inv.supplierTaxNumber,
        customerName: inv.customerName,
        customerTaxNumber: inv.customerTaxNumber,
        currency: inv.currency,
        netAmount: inv.netAmount,
        vatAmount: inv.vatAmount,
        grossAmount: inv.grossAmount,
        rawJson: inv.rawJson,
        lines: {
          create: (inv.lines ?? []).map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            netAmount: l.netAmount,
            vatAmount: l.vatAmount,
            grossAmount: l.grossAmount,
          })),
        },
      },
    });

    if (inv.direction === "incoming") {
      const result = classifyExpense(
        inv.supplierName,
        inv.supplierName,
        inv.lines
      );

      await prisma.expenseClassification.create({
        data: {
          invoiceId: dbInvoice.id,
          category: result.category,
          classification: result.classification,
          confidenceScore: result.confidenceScore,
          reason: result.reason,
        },
      });
    }

    created++;
  }

  return { created, skipped, total: allInvoices.length };
}
