import { BaseInvoiceProvider, ProviderConfig, ProviderInvoice } from "./base-provider";
import { addDays, subDays } from "date-fns";

const MOCK_SUPPLIERS = [
  { name: "Microsoft Yazılım A.Ş.", taxNo: "1234567890" },
  { name: "Turkcell İletişim Hizmetleri A.Ş.", taxNo: "2345678901" },
  { name: "Saray Ofis Kiralama Ltd.", taxNo: "3456789012" },
  { name: "ABC Mali Müşavirlik", taxNo: "4567890123" },
  { name: "Opet Yakıt A.Ş.", taxNo: "5678901234" },
  { name: "Yılmaz Kargo", taxNo: "6789012345" },
  { name: "Google Reklam Hizmetleri", taxNo: "7890123456" },
  { name: "İstanbul Market A.Ş.", taxNo: "8901234567" },
  { name: "Ankara Restoran Ltd.", taxNo: "9012345678" },
  { name: "Garanti Sigorta A.Ş.", taxNo: "0123456789" },
];

const MOCK_CUSTOMERS = [
  { name: "Ayşe Teknoloji Ltd. Şti.", taxNo: "1111111111" },
  { name: "Mehmet Yazılım A.Ş.", taxNo: "2222222222" },
  { name: "Star E-Ticaret Ltd.", taxNo: "3333333333" },
  { name: "Delta Danışmanlık A.Ş.", taxNo: "4444444444" },
  { name: "Küçük İşletme Tic. Ltd.", taxNo: "5555555555" },
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInvoice(
  index: number,
  direction: "incoming" | "outgoing",
  baseDate: Date
): ProviderInvoice {
  const netAmount = randomBetween(500, 50000);
  const vatRate = [10, 20][randomBetween(0, 1)];
  const vatAmount = Math.round(netAmount * (vatRate / 100));
  const grossAmount = netAmount + vatAmount;

  const supplier =
    direction === "incoming"
      ? MOCK_SUPPLIERS[index % MOCK_SUPPLIERS.length]
      : { name: "Kendi Firmamız", taxNo: "9999999999" };
  const customer =
    direction === "outgoing"
      ? MOCK_CUSTOMERS[index % MOCK_CUSTOMERS.length]
      : { name: "Kendi Firmamız", taxNo: "9999999999" };

  return {
    invoiceNumber: `${direction === "incoming" ? "GEL" : "GID"}-2025-${String(index + 1).padStart(4, "0")}`,
    ettn: `${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    invoiceDate: subDays(baseDate, randomBetween(0, 60)),
    supplierName: supplier.name,
    supplierTaxNumber: supplier.taxNo,
    customerName: customer.name,
    customerTaxNumber: customer.taxNo,
    currency: "TRY",
    netAmount,
    vatAmount,
    grossAmount,
    invoiceType: "eInvoice",
    lines: [
      {
        description: `Hizmet / Mal Bedeli - ${supplier.name}`,
        quantity: 1,
        unitPrice: netAmount,
        vatRate,
        netAmount,
        vatAmount,
        grossAmount,
      },
    ],
  };
}

export class MockInvoiceProvider extends BaseInvoiceProvider {
  constructor(config?: Partial<ProviderConfig>) {
    super({
      baseUrl: "mock://localhost",
      username: "mock_user",
      password: "mock_pass",
      ...config,
    });
  }

  async loginToProvider(): Promise<void> {
    // Mock: no-op
  }

  async getIncomingInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]> {
    return Array.from({ length: 20 }, (_, i) =>
      generateInvoice(i, "incoming", endDate)
    );
  }

  async getOutgoingInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]> {
    return Array.from({ length: 15 }, (_, i) =>
      generateInvoice(i, "outgoing", endDate)
    );
  }

  async getEArchiveInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]> {
    return Array.from({ length: 5 }, (_, i) =>
      generateInvoice(i + 100, "outgoing", endDate)
    );
  }

  async getInvoiceXml(invoiceIdOrEttn: string): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?><Invoice><ID>${invoiceIdOrEttn}</ID><MockData>true</MockData></Invoice>`;
  }

  async getInvoicePdf(invoiceIdOrEttn: string): Promise<Buffer> {
    return Buffer.from(`Mock PDF for ${invoiceIdOrEttn}`);
  }
}
