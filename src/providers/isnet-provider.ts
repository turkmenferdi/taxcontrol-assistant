/**
 * İşNet NetteFatura Provider Adapter
 *
 * TODO: Confirm the following with İşNet NetteFatura API documentation:
 *   - Base URL for production and test environments
 *   - Authentication method (username/password vs token vs OAuth)
 *   - Exact endpoint paths and HTTP methods
 *   - Request/response payload structure
 *   - Invoice XML/PDF retrieval endpoints
 *   - Rate limits and pagination
 *
 * Contact: https://www.isnet.net.tr / NetteFatura API docs
 */

import { BaseInvoiceProvider, ProviderConfig, ProviderInvoice } from "./base-provider";

interface IsnetAuthResponse {
  // TODO: Confirm actual response fields from İşNet API
  token?: string;
  sessionId?: string;
  expiresIn?: number;
}

interface IsnetInvoiceRaw {
  // TODO: Map actual İşNet invoice response fields
  FaturaNo?: string;
  ETTN?: string;
  FaturaTarihi?: string;
  GonderenAdi?: string;
  GonderenVKN?: string;
  AliciAdi?: string;
  AliciVKN?: string;
  MatrahTutari?: number;
  KDVTutari?: number;
  ToplamTutar?: number;
  FaturaTipi?: string;
  [key: string]: unknown;
}

export class IsnetProvider extends BaseInvoiceProvider {
  private authToken: string | null = null;

  constructor(config: ProviderConfig) {
    super(config);
  }

  async loginToProvider(): Promise<void> {
    // TODO: Confirm authentication endpoint and payload structure with İşNet
    // Example implementation — actual endpoint may differ:
    //
    // const response = await fetch(`${this.config.baseUrl}/auth/login`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     username: this.config.username,
    //     password: this.config.password,
    //     companyId: this.config.companyId,
    //   }),
    // });
    // const data: IsnetAuthResponse = await response.json();
    // this.authToken = data.token ?? null;

    throw new Error(
      "İşNet provider is not yet configured. Please provide API credentials and confirm endpoint details."
    );
  }

  private getHeaders(): Record<string, string> {
    // TODO: Confirm required headers (Authorization format, API key header name, etc.)
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.authToken}`,
      // "X-API-Key": this.config.token ?? "",
      // "X-Company-Id": this.config.companyId ?? "",
    };
  }

  private formatDate(date: Date): string {
    // TODO: Confirm date format expected by İşNet API (ISO8601, DD.MM.YYYY, etc.)
    return date.toISOString().split("T")[0];
  }

  private mapInvoice(raw: IsnetInvoiceRaw, direction: "incoming" | "outgoing"): ProviderInvoice {
    // TODO: Map actual field names from İşNet API response
    return {
      invoiceNumber: raw.FaturaNo ?? "",
      ettn: raw.ETTN,
      invoiceDate: raw.FaturaTarihi ? new Date(raw.FaturaTarihi) : new Date(),
      supplierName: raw.GonderenAdi ?? "",
      supplierTaxNumber: raw.GonderenVKN ?? "",
      customerName: raw.AliciAdi ?? "",
      customerTaxNumber: raw.AliciVKN ?? "",
      currency: "TRY",
      netAmount: raw.MatrahTutari ?? 0,
      vatAmount: raw.KDVTutari ?? 0,
      grossAmount: raw.ToplamTutar ?? 0,
      invoiceType: raw.FaturaTipi === "eArsiv" ? "eArchive" : "eInvoice",
      rawJson: JSON.stringify(raw),
    };
  }

  async getIncomingInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]> {
    // TODO: Confirm endpoint path and request payload for incoming invoices
    // const response = await fetch(`${this.config.baseUrl}/invoices/incoming`, {
    //   method: "POST",
    //   headers: this.getHeaders(),
    //   body: JSON.stringify({
    //     startDate: this.formatDate(startDate),
    //     endDate: this.formatDate(endDate),
    //   }),
    // });
    // const data = await response.json();
    // return (data.invoices ?? []).map((r: IsnetInvoiceRaw) => this.mapInvoice(r, "incoming"));
    throw new Error("İşNet getIncomingInvoices not implemented yet.");
  }

  async getOutgoingInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]> {
    // TODO: Confirm endpoint path and request payload for outgoing invoices
    throw new Error("İşNet getOutgoingInvoices not implemented yet.");
  }

  async getEArchiveInvoices(startDate: Date, endDate: Date): Promise<ProviderInvoice[]> {
    // TODO: Confirm e-Archive invoice endpoint
    throw new Error("İşNet getEArchiveInvoices not implemented yet.");
  }

  async getInvoiceXml(invoiceIdOrEttn: string): Promise<string> {
    // TODO: Confirm XML retrieval endpoint (by invoice ID or ETTN)
    // const response = await fetch(`${this.config.baseUrl}/invoices/${invoiceIdOrEttn}/xml`, {
    //   headers: this.getHeaders(),
    // });
    // return response.text();
    throw new Error("İşNet getInvoiceXml not implemented yet.");
  }

  async getInvoicePdf(invoiceIdOrEttn: string): Promise<Buffer> {
    // TODO: Confirm PDF retrieval endpoint
    throw new Error("İşNet getInvoicePdf not implemented yet.");
  }
}
