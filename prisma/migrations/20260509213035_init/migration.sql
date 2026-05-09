-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,
    "taxOffice" TEXT,
    "companyType" TEXT NOT NULL DEFAULT 'sole_proprietorship',
    "vatPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "providerName" TEXT,
    "providerConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerName" TEXT,
    "invoiceDirection" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL DEFAULT 'eInvoice',
    "invoiceNumber" TEXT,
    "ettn" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "supplierName" TEXT,
    "supplierTaxNumber" TEXT,
    "customerName" TEXT,
    "customerTaxNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "rawXml" TEXT,
    "rawJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClassification" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "category" TEXT,
    "classification" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "accountantNote" TEXT,
    "accountantFinalDecision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSummary" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "outgoingNetTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outgoingVatTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incomingNetTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductibleVatTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nonDeductibleVatTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedPayableVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedCarryForwardVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedProvisionalTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "companyType" TEXT NOT NULL,
    "rateType" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseClassification_invoiceId_key" ON "ExpenseClassification"("invoiceId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClassification" ADD CONSTRAINT "ExpenseClassification_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxSummary" ADD CONSTRAINT "TaxSummary_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
