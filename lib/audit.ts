import type { Prisma } from "@/generated/prisma/client";

export async function writeAudit(
  tx: Prisma.TransactionClient,
  data: {
    organizationId: string;
    actorUserId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await tx.auditEvent.create({
    data: {
      organizationId: data.organizationId,
      actorUserId: data.actorUserId ?? null,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId ?? null,
      metadata: data.metadata,
    },
  });
}

export async function writeRevision(
  tx: Prisma.TransactionClient,
  data: {
    organizationId: string;
    actorUserId?: string | null;
    resourceType: string;
    resourceId: string;
    action: string;
    snapshot?: Prisma.InputJsonValue;
  },
) {
  await tx.contentRevision.create({
    data: {
      organizationId: data.organizationId,
      actorUserId: data.actorUserId ?? null,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      snapshot: data.snapshot,
    },
  });
}
