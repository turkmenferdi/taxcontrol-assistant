export interface ProviderInvoice {
  invoiceNumber: string;
  ettn?: string;
  invoiceDate: Date;
  supplierName: string;
  supplierTaxNumber: string;
  customerName: string;
  customerTaxNumber: string;
  currency: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  invoiceType: "eInvoice" | "eArchive" | "other";
  xmlUrl?: string;
  pdfUrl?: string;
  rawJson?: string;
  lines?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }>;
}

export interface ProviderConfig {
  baseUrl: string;
  username: string;
  password: string;
  companyId?: string;
  token?: string;
  [key: string]: unknown;
}

export abstract class BaseInvoiceProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract loginToProvider(): Promise<void>;
  abstract getIncomingInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]>;
  abstract getOutgoingInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]>;
  abstract getEArchiveInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]>;
  abstract getInvoiceXml(invoiceIdOrEttn: string): Promise<string>;
  abstract getInvoicePdf(invoiceIdOrEttn: string): Promise<Buffer>;
}
