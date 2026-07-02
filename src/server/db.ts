import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Prisma via the pg driver adapter (WASM query engine) — no native engine
 * binary needed, which keeps the app runnable in restricted environments.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const db = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
