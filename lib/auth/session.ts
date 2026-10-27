import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { getPrisma } from "@/lib/db/prisma";

export const getStudioSession = cache(async () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!process.env.DATABASE_URL || !secret || secret.length < 32) return null;
  return getAuth().api.getSession({ headers: await headers() });
});

export const getStudioWorkspaceAccess = cache(async () => {
  const session = await getStudioSession();
  if (!session) return { session: null, membership: null, canInitializeWorkspace: false };

  const prisma = getPrisma();
  const [membership, user] = await Promise.all([
    prisma.member.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  const isPlatformAdmin = user?.role?.split(",").includes("admin") ?? false;
  const canInitializeWorkspace = !membership && isPlatformAdmin
    ? (await prisma.organization.count()) === 0
    : false;

  return { session, membership, canInitializeWorkspace };
});

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("A signed-in staff session is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "AuthorizationDeniedError";
  }
}

export async function requireStudioPermission(
  organizationId: string,
  permissions: Record<string, string[]>,
) {
  const session = await getStudioSession();
  if (!session) throw new AuthenticationRequiredError();

  const result = await getAuth().api.hasPermission({
    headers: await headers(),
    body: { organizationId, permissions },
  });
  if (!result.success) throw new AuthorizationDeniedError();
  return session;
}

export async function hasStudioPermission(
  organizationId: string,
  permissions: Record<string, string[]>,
) {
  const session = await getStudioSession();
  if (!session) return false;
  const result = await getAuth().api.hasPermission({
    headers: await headers(),
    body: { organizationId, permissions },
  });
  return result.success;
}

export async function requireStudioAction(permissions: Record<string, string[]>) {
  const access = await getStudioWorkspaceAccess();
  if (!access.session) redirect("/studio/sign-in");
  if (!access.membership) redirect("/studio/access-pending");
  await requireStudioPermission(access.membership.organizationId, permissions);
  return { session: access.session, membership: access.membership, organizationId: access.membership.organizationId };
}
