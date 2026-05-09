import { prisma } from "@/lib/prisma";

export interface VatSummary {
  outgoingNetTotal: number;
  outgoingVatTotal: number;
  incomingNetTotal: number;
  deductibleVatTotal: number;
  nonDeductibleVatTotal: number;
  estimatedPayableVat: number;
  estimatedCarryForwardVat: number;
}

export interface ProvisionalTaxSummary {
  revenue: number;
  deductibleExpenses: number;
  estimatedProfit: number;
  taxRate: number;
  estimatedProvisionalTax: number;
}

export async function calculateVatSummary(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<VatSummary> {
  const outgoing = await prisma.invoice.findMany({
    where: {
      companyId,
      invoiceDirection: "outgoing",
      invoiceDate: { gte: startDate, lte: endDate },
      status: "active",
    },
  });

  const incoming = await prisma.invoice.findMany({
    where: {
      companyId,
      invoiceDirection: "incoming",
      invoiceDate: { gte: startDate, lte: endDate },
      status: "active",
    },
    include: { classification: true },
  });

  const outgoingNetTotal = outgoing.reduce((s, i) => s + i.netAmount, 0);
  const outgoingVatTotal = outgoing.reduce((s, i) => s + i.vatAmount, 0);
  const incomingNetTotal = incoming.reduce((s, i) => s + i.netAmount, 0);

  let deductibleVatTotal = 0;
  let nonDeductibleVatTotal = 0;

  for (const inv of incoming) {
    const effectiveClass =
      inv.classification?.accountantFinalDecision ??
      inv.classification?.classification ??
      "accountant_review_required";

    if (effectiveClass === "deductible") {
      deductibleVatTotal += inv.vatAmount;
    } else if (effectiveClass === "non_deductible") {
      nonDeductibleVatTotal += inv.vatAmount;
    } else if (effectiveClass === "partially_deductible") {
      deductibleVatTotal += inv.vatAmount * 0.5;
      nonDeductibleVatTotal += inv.vatAmount * 0.5;
    }
    // accountant_review_required: excluded from deductible until confirmed
  }

  const netVat = outgoingVatTotal - deductibleVatTotal;
  const estimatedPayableVat = Math.max(netVat, 0);
  const estimatedCarryForwardVat = Math.max(-netVat, 0);

  return {
    outgoingNetTotal,
    outgoingVatTotal,
    incomingNetTotal,
    deductibleVatTotal,
    nonDeductibleVatTotal,
    estimatedPayableVat,
    estimatedCarryForwardVat,
  };
}

export async function getProvisionalTaxRate(
  companyType: string,
  year: number
): Promise<number> {
  const rate = await prisma.taxRate.findFirst({
    where: { year, companyType, rateType: "provisional_tax" },
  });
  // Default: 15% for sole proprietorship, 25% for limited company
  if (rate) return rate.rate;
  if (companyType === "limited_company") return 0.25;
  return 0.15;
}

export async function calculateProvisionalTax(
  companyId: string,
  companyType: string,
  startDate: Date,
  endDate: Date
): Promise<ProvisionalTaxSummary> {
  const year = startDate.getFullYear();

  const outgoing = await prisma.invoice.findMany({
    where: {
      companyId,
      invoiceDirection: "outgoing",
      invoiceDate: { gte: startDate, lte: endDate },
      status: "active",
    },
  });

  const incoming = await prisma.invoice.findMany({
    where: {
      companyId,
      invoiceDirection: "incoming",
      invoiceDate: { gte: startDate, lte: endDate },
      status: "active",
    },
    include: { classification: true },
  });

  const revenue = outgoing.reduce((s, i) => s + i.netAmount, 0);

  let deductibleExpenses = 0;
  for (const inv of incoming) {
    const effectiveClass =
      inv.classification?.accountantFinalDecision ??
      inv.classification?.classification ??
      "accountant_review_required";

    if (effectiveClass === "deductible") {
      deductibleExpenses += inv.netAmount;
    } else if (effectiveClass === "partially_deductible") {
      deductibleExpenses += inv.netAmount * 0.5;
    }
  }

  const estimatedProfit = Math.max(revenue - deductibleExpenses, 0);
  const taxRate = await getProvisionalTaxRate(companyType, year);
  const estimatedProvisionalTax = estimatedProfit * taxRate;

  return {
    revenue,
    deductibleExpenses,
    estimatedProfit,
    taxRate,
    estimatedProvisionalTax,
  };
}

export async function saveOrUpdateTaxSummary(
  companyId: string,
  periodType: string,
  startDate: Date,
  endDate: Date,
  companyType: string
) {
  const vat = await calculateVatSummary(companyId, startDate, endDate);
  const provisional = await calculateProvisionalTax(
    companyId,
    companyType,
    startDate,
    endDate
  );

  const existing = await prisma.taxSummary.findFirst({
    where: { companyId, periodType, startDate, endDate },
  });

  const data = {
    companyId,
    periodType,
    startDate,
    endDate,
    outgoingNetTotal: vat.outgoingNetTotal,
    outgoingVatTotal: vat.outgoingVatTotal,
    incomingNetTotal: vat.incomingNetTotal,
    deductibleVatTotal: vat.deductibleVatTotal,
    nonDeductibleVatTotal: vat.nonDeductibleVatTotal,
    estimatedPayableVat: vat.estimatedPayableVat,
    estimatedCarryForwardVat: vat.estimatedCarryForwardVat,
    estimatedProfit: provisional.estimatedProfit,
    estimatedProvisionalTax: provisional.estimatedProvisionalTax,
  };

  if (existing) {
    return prisma.taxSummary.update({ where: { id: existing.id }, data });
  }
  return prisma.taxSummary.create({ data });
}
