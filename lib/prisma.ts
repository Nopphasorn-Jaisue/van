import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pool?: Pool };

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

let pool = globalForPrisma.pool;
if (!pool && connectionString) {
  pool = new Pool({ 
    connectionString,
    max: 15,
    idleTimeoutMillis: 30000 
  });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }
}

const adapter = pool ? new PrismaPg(pool) : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
