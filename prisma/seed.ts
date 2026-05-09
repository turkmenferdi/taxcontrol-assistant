import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { classifyExpense } from "../src/services/expense-classification.service";
import path from "path";

function createClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (dbUrl.startsWith("postgres")) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: dbUrl });
    return new PrismaClient({ adapter: new PrismaPg(pool) } as never);
  }
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const dbPath = path.resolve(__dirname, "../dev.db");
  return new PrismaClient({ adapter: new PrismaLibSql({ url: `file:${dbPath}` }) } as never);
}

const prisma = createClient();

const SUPPLIERS = [
  { name: "Microsoft Yazılım A.Ş.", tax: "1234567890", net: 2490, vat: 448, desc: "Microsoft 365 Aboneliği" },
  { name: "Turkcell İletişim A.Ş.", tax: "2345678901", net: 1200, vat: 216, desc: "İnternet ve Telefon Hizmeti" },
  { name: "Saray Ofis Kiralama Ltd.", tax: "3456789012", net: 8000, vat: 1440, desc: "Ofis Kira Bedeli" },
  { name: "ABC Mali Müşavirlik", tax: "4567890123", net: 3000, vat: 540, desc: "Muhasebe Hizmeti" },
  { name: "Opet Yakıt A.Ş.", tax: "5678901234", net: 800, vat: 144, desc: "Araç Yakıt Gideri" },
  { name: "Yılmaz Kargo", tax: "6789012345", net: 450, vat: 81, desc: "Kargo ve Nakliye" },
  { name: "Google Reklam Hizmetleri", tax: "7890123456", net: 5000, vat: 900, desc: "Google Ads Reklam" },
  { name: "İstanbul Market A.Ş.", tax: "8901234567", net: 350, vat: 70, desc: "Market Alışverişi" },
  { name: "Ankara Restoran Ltd.", tax: "9012345678", net: 600, vat: 120, desc: "İş Yemeği" },
  { name: "Garanti Sigorta A.Ş.", tax: "0123456789", net: 2200, vat: 396, desc: "İşyeri Sigortası" },
  { name: "Apple Store", tax: "1122334455", net: 15000, vat: 2700, desc: "MacBook Laptop" },
  { name: "Shell Akaryakıt", tax: "2233445566", net: 650, vat: 130, desc: "Benzin" },
  { name: "Hilton Otel", tax: "3344556677", net: 3500, vat: 630, desc: "İş Seyahati Konaklama" },
  { name: "Kırtasiye Dünyası", tax: "4455667788", net: 280, vat: 50, desc: "Kırtasiye Malzemeleri" },
  { name: "BIM Market", tax: "5566778899", net: 420, vat: 76, desc: "Ev/Ofis Alışverişi" },
];

const CUSTOMERS = [
  { name: "Ayşe Teknoloji Ltd. Şti.", tax: "1111111111" },
  { name: "Mehmet Yazılım A.Ş.", tax: "2222222222" },
  { name: "Star E-Ticaret Ltd.", tax: "3333333333" },
  { name: "Delta Danışmanlık A.Ş.", tax: "4444444444" },
  { name: "Küçük İşletme Tic. Ltd.", tax: "5555555555" },
];

function rndDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
}

async function main() {
  console.log("Seeding database...");

  await prisma.user.deleteMany();
  await prisma.taxRate.deleteMany();

  // Demo user
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.create({
    data: {
      email: "demo@taxcontrol.io",
      passwordHash,
      name: "Demo Kullanıcı",
    },
  });

  // Company
  const company = await prisma.company.create({
    data: {
      userId: user.id,
      name: "Demo Yazılım Ltd. Şti.",
      taxNumber: "1234567890",
      taxOffice: "Kadıköy Vergi Dairesi",
      companyType: "sole_proprietorship",
      vatPeriod: "monthly",
      providerName: "mock",
    },
  });

  // Tax rates
  await prisma.taxRate.createMany({
    data: [
      { year: 2025, companyType: "sole_proprietorship", rateType: "provisional_tax", rate: 0.15, description: "Şahıs şirketi geçici vergi oranı" },
      { year: 2025, companyType: "limited_company", rateType: "provisional_tax", rate: 0.25, description: "Limited şirket geçici vergi oranı" },
      { year: 2026, companyType: "sole_proprietorship", rateType: "provisional_tax", rate: 0.15, description: "Şahıs şirketi geçici vergi oranı" },
      { year: 2026, companyType: "limited_company", rateType: "provisional_tax", rate: 0.25, description: "Limited şirket geçici vergi oranı" },
    ],
  });

  // Incoming invoices
  for (let i = 0; i < SUPPLIERS.length; i++) {
    const s = SUPPLIERS[i];
    const inv = await prisma.invoice.create({
      data: {
        companyId: company.id,
        providerName: "mock",
        invoiceDirection: "incoming",
        invoiceType: "eInvoice",
        invoiceNumber: `GEL-2025-${String(i + 1).padStart(4, "0")}`,
        ettn: `MOCK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        invoiceDate: rndDate(90),
        supplierName: s.name,
        supplierTaxNumber: s.tax,
        customerName: company.name,
        customerTaxNumber: company.taxNumber,
        currency: "TRY",
        netAmount: s.net,
        vatAmount: s.vat,
        grossAmount: s.net + s.vat,
        lines: {
          create: [{
            description: s.desc,
            quantity: 1,
            unitPrice: s.net,
            vatRate: Math.round((s.vat / s.net) * 100),
            netAmount: s.net,
            vatAmount: s.vat,
            grossAmount: s.net + s.vat,
          }],
        },
      },
    });

    const result = classifyExpense(s.name, s.desc, [{ description: s.desc }]);
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

  // Outgoing invoices
  for (let i = 0; i < CUSTOMERS.length * 3; i++) {
    const c = CUSTOMERS[i % CUSTOMERS.length];
    const net = 5000 + Math.floor(Math.random() * 20000);
    const vat = Math.round(net * 0.20);
    await prisma.invoice.create({
      data: {
        companyId: company.id,
        providerName: "mock",
        invoiceDirection: "outgoing",
        invoiceType: i % 4 === 0 ? "eArchive" : "eInvoice",
        invoiceNumber: `GID-2025-${String(i + 1).padStart(4, "0")}`,
        ettn: `MOCK-OUT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        invoiceDate: rndDate(90),
        supplierName: company.name,
        supplierTaxNumber: company.taxNumber,
        customerName: c.name,
        customerTaxNumber: c.tax,
        currency: "TRY",
        netAmount: net,
        vatAmount: vat,
        grossAmount: net + vat,
      },
    });
  }

  console.log(`Done. User: demo@taxcontrol.io / demo1234`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
