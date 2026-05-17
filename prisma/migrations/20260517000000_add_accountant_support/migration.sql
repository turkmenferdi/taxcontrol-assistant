-- AlterTable: add role to User
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'owner';

-- CreateTable: CompanyAccess
CREATE TABLE "CompanyAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAccess_userId_companyId_key" ON "CompanyAccess"("userId", "companyId");

-- AddForeignKey
ALTER TABLE "CompanyAccess" ADD CONSTRAINT "CompanyAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAccess" ADD CONSTRAINT "CompanyAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
