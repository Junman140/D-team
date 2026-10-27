import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { dTeamPrisma?: PrismaClient };

export function getPrisma() {
  if (globalForPrisma.dTeamPrisma) return globalForPrisma.dTeamPrisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for the D-Team data layer.");

  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });
  globalForPrisma.dTeamPrisma = client;
  return client;
}
