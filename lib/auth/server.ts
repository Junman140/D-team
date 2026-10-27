import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { authOptions } from "@/lib/auth/options";
import { getPrisma } from "@/lib/db/prisma";

function createStudioAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }

  return betterAuth({
    ...authOptions,
    secret,
    database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
  });
}

type StudioAuth = ReturnType<typeof createStudioAuth>;
let authInstance: StudioAuth | undefined;

export function getAuth(): StudioAuth {
  if (authInstance) return authInstance;
  authInstance = createStudioAuth();
  return authInstance;
}
