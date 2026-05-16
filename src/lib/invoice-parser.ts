import * as XLSX from "xlsx";

export interface ParsedInvoiceRow {
  invoiceNumber?: string;
  ettn?: string;
  invoiceDate?: Date;
  supplierName?: string;
  supplierTaxNumber?: string;
  customerName?: string;
  customerTaxNumber?: string;
  netAmount?: number;
  vatAmount?: number;
  grossAmount?: number;
  invoiceType?: string;
}

export interface ParseResult {
  rows: ParsedInvoiceRow[];
  warnings: string[];
  detectedHeaders: Record<string, string>;
}

// Turkish header aliases → our field names
const COLUMN_ALIASES: Record<string, string> = {
  // Invoice number
  "fatura no": "invoiceNumber",
  "fatura numarası": "invoiceNumber",
  "faturano": "invoiceNumber",
  "invoice no": "invoiceNumber",
  "invoice number": "invoiceNumber",
  "belge no": "invoiceNumber",

  // ETTN / UUID
  "ettn": "ettn",
  "uuid": "ettn",
  "belge id": "ettn",

  // Date
  "tarih": "invoiceDate",
  "fatura tarihi": "invoiceDate",
  "düzenleme tarihi": "invoiceDate",
  "invoice date": "invoiceDate",
  "date": "invoiceDate",

  // Supplier
  "gönderen": "supplierName",
  "gönderen adı": "supplierName",
  "gönderen ünvanı": "supplierName",
  "tedarikçi": "supplierName",
  "tedarikçi adı": "supplierName",
  "satıcı": "supplierName",
  "satıcı adı": "supplierName",
  "supplier": "supplierName",
  "supplier name": "supplierName",

  // Supplier tax number
  "gönderen vkn": "supplierTaxNumber",
  "gönderen vkn/tckn": "supplierTaxNumber",
  "tedarikçi vkn": "supplierTaxNumber",
  "satıcı vkn": "supplierTaxNumber",
  "vkn": "supplierTaxNumber",
  "vergi no": "supplierTaxNumber",
  "supplier tax": "supplierTaxNumber",
  "supplier vkn": "supplierTaxNumber",

  // Customer
  "alıcı": "customerName",
  "alıcı adı": "customerName",
  "alıcı ünvanı": "customerName",
  "müşteri": "customerName",
  "müşteri adı": "customerName",
  "customer": "customerName",
  "customer name": "customerName",

  // Customer tax number
  "alıcı vkn": "customerTaxNumber",
  "alıcı vkn/tckn": "customerTaxNumber",
  "müşteri vkn": "customerTaxNumber",
  "customer tax": "customerTaxNumber",
  "customer vkn": "customerTaxNumber",

  // Amounts
  "matrah": "netAmount",
  "net tutar": "netAmount",
  "net amount": "netAmount",
  "vergisiz tutar": "netAmount",
  "mal hizmet toplam tutarı": "netAmount",

  "kdv": "vatAmount",
  "kdv tutarı": "vatAmount",
  "kdv tutar": "vatAmount",
  "vat": "vatAmount",
  "vat amount": "vatAmount",
  "vergi tutarı": "vatAmount",

  "toplam": "grossAmount",
  "brüt tutar": "grossAmount",
  "toplam tutar": "grossAmount",
  "gross amount": "grossAmount",
  "genel toplam": "grossAmount",
  "ödenecek tutar": "grossAmount",

  // Invoice type
  "fatura tipi": "invoiceType",
  "tip": "invoiceType",
  "type": "invoiceType",
  "belge tipi": "invoiceType",
};

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

function parseAmount(val: unknown): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "number") return val;
  const str = String(val)
    .replace(/\./g, "")   // remove thousand separators (TR style: 1.234,56)
    .replace(",", ".")    // decimal comma → dot
    .replace(/[^\d.-]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
}

function parseDate(val: unknown): Date | undefined {
  if (!val) return undefined;
  // Excel serial number
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const str = String(val).trim();
  // DD.MM.YYYY
  const dmy = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  // YYYY-MM-DD
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

function mapInvoiceType(val: unknown): string {
  const s = String(val ?? "").toLowerCase();
  if (s.includes("arsiv") || s.includes("arşiv") || s.includes("archive")) return "eArchive";
  return "eInvoice";
}

export function parseInvoiceFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (raw.length < 2) {
    return { rows: [], warnings: ["Dosyada veri bulunamadı."], detectedHeaders: {} };
  }

  // Find header row (first row with enough non-empty cells)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const nonEmpty = (raw[i] as unknown[]).filter((c) => String(c).trim() !== "").length;
    if (nonEmpty >= 3) { headerRowIdx = i; break; }
  }

  const headers = (raw[headerRowIdx] as unknown[]).map((h) => String(h));
  const fieldMap: Record<number, string> = {};
  const detectedHeaders: Record<string, string> = {};

  for (let i = 0; i < headers.length; i++) {
    const norm = normalizeHeader(headers[i]);
    const field = COLUMN_ALIASES[norm];
    if (field) {
      fieldMap[i] = field;
      detectedHeaders[headers[i]] = field;
    }
  }

  const warnings: string[] = [];
  const requiredFields = ["invoiceDate", "grossAmount"];
  const detectedFields = Object.values(fieldMap);
  for (const req of requiredFields) {
    if (!detectedFields.includes(req)) {
      warnings.push(`"${req}" kolonu tespit edilemedi — bazı satırlar eksik olabilir.`);
    }
  }

  const rows: ParsedInvoiceRow[] = [];
  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const cells = raw[r] as unknown[];
    // Skip empty rows
    if (cells.every((c) => String(c).trim() === "")) continue;

    const row: ParsedInvoiceRow = {};
    for (const [colIdx, field] of Object.entries(fieldMap)) {
      const val = cells[Number(colIdx)];
      if (field === "invoiceDate") {
        row.invoiceDate = parseDate(val);
      } else if (field === "netAmount") {
        row.netAmount = parseAmount(val);
      } else if (field === "vatAmount") {
        row.vatAmount = parseAmount(val);
      } else if (field === "grossAmount") {
        row.grossAmount = parseAmount(val);
      } else if (field === "invoiceType") {
        row.invoiceType = mapInvoiceType(val);
      } else {
        (row as Record<string, unknown>)[field] = String(val ?? "").trim() || undefined;
      }
    }

    // Derive missing amounts
    if (row.netAmount && row.vatAmount && !row.grossAmount) {
      row.grossAmount = row.netAmount + row.vatAmount;
    }
    if (row.grossAmount && row.vatAmount && !row.netAmount) {
      row.netAmount = row.grossAmount - row.vatAmount;
    }
    if (row.netAmount && row.grossAmount && !row.vatAmount) {
      row.vatAmount = row.grossAmount - row.netAmount;
    }

    // Only include rows with at least a date or amount
    if (row.invoiceDate || row.grossAmount) {
      rows.push(row);
    }
  }

  return { rows, warnings, detectedHeaders };
}
