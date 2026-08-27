import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pool?: Pool };

const defaultUrl = "postgresql://postgres.ljcfcyeohhzvgbztrsss:Joule404325@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || defaultUrl;
const connectionString = rawUrl.replace('?pgbouncer=true', '');

let pool = globalForPrisma.pool;
if (!pool) {
  pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 15000 
  });
  globalForPrisma.pool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
