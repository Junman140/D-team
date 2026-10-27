import "dotenv/config";
import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { authOptions } from "./lib/auth/options";

// CLI-only config for schema generation/checks; it never opens a database connection.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://schema-only:schema-only@localhost:5432/schema_only",
});
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  ...authOptions,
  secret: process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("base64url"),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
});
