import { PrismaClient } from "@prisma/client";
import path from "path";

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "";

  // PostgreSQL (Vercel/production)
  if (dbUrl.startsWith("postgres") || dbUrl.startsWith("postgresql")) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as never);
  }

  // SQLite via libSQL (local development)
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const rawUrl = dbUrl || "file:./dev.db";
  const url = rawUrl.startsWith("file:./")
    ? `file:${path.resolve(process.cwd(), rawUrl.slice(7))}`
    : rawUrl;
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter } as never);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
