-- Add note and updatedAt to CompanyAccess
ALTER TABLE "CompanyAccess" ADD COLUMN "note" TEXT;
ALTER TABLE "CompanyAccess" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
