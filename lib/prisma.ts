import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pool?: Pool };

if (!process.env.DATABASE_URL && !process.env.DIRECT_URL && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if file doesn't exist
  }
}

const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!rawUrl) {
  throw new Error("Missing DATABASE_URL or DIRECT_URL in environment configuration.");
}
const connectionString = rawUrl.replace('?pgbouncer=true', '');

let pool = globalForPrisma.pool;
if (!pool) {
  pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 1000 * 60 * 10, // Keep connection alive for 10 minutes (prevents cold-start delays on navigation)
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
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
  globalForPrisma.pool = pool;
}

