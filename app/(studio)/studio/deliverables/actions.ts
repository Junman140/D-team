"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit } from "@/lib/audit";
import { formDate, formText, optionalText, optionalTextLimit, requireText } from "@/lib/forms";

const DELIVERABLE_STATUSES = ["planned", "in-progress", "review", "delivered"] as const;

function deliverableFields(formData: FormData) {
  const projectId = requireText(formText(formData, "projectId"), "Project", 1, 100);
  const title = requireText(formText(formData, "title"), "Deliverable title", 2, 160);
  const status = formText(formData, "status") || "planned";
  if (!DELIVERABLE_STATUSES.includes(status as (typeof DELIVERABLE_STATUSES)[number])) throw new Error("Choose a valid deliverable status.");
  const reviewUrl = optionalTextLimit(optionalText(formData, "reviewUrl"), "Review URL", 1000);
  if (reviewUrl && !/^https:\/\//i.test(reviewUrl)) throw new Error("Review links must use HTTPS.");
  return {
    projectId,
    title,
    description: optionalTextLimit(optionalText(formData, "description"), "Description", 5000),
    status,
    dueAt: formDate(formData, "dueAt"),
    reviewUrl,
  };
}

async function editor(permission: "create" | "update" | "deliver") {
  const access = await requireStudioAction({ deliverable: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

async function assertProject(organizationId: string, projectId: string) {
  const project = await getPrisma().project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } });
  if (!project) throw new Error("Choose a project from this workspace.");
}

export async function createDeliverable(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = deliverableFields(formData);
  await assertProject(organizationId, data.projectId);
  const prisma = getPrisma();
  const deliverable = await prisma.$transaction(async (tx) => {
    const created = await tx.deliverable.create({ data: { ...data, organizationId, deliveredAt: data.status === "delivered" ? new Date() : null } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "deliverable", resourceId: created.id, metadata: { projectId: created.projectId } });
    return created;
  });
  revalidatePath("/studio/deliverables");
  revalidatePath(`/studio/projects/${deliverable.projectId}`);
  redirect(`/studio/deliverables?created=${encodeURIComponent(deliverable.id)}`);
}

export async function updateDeliverable(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = deliverableFields(formData);
  await assertProject(organizationId, data.projectId);
  const prisma = getPrisma();
  const deliverable = await prisma.$transaction(async (tx) => {
    const existing = await tx.deliverable.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!existing) throw new Error("Deliverable not found.");
    const updated = await tx.deliverable.update({ where: { id }, data: { ...data, deliveredAt: data.status === "delivered" ? new Date() : null } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "deliverable", resourceId: updated.id });
    return updated;
  });
  revalidatePath("/studio/deliverables");
  revalidatePath(`/studio/projects/${deliverable.projectId}`);
  redirect(`/studio/deliverables?updated=${encodeURIComponent(deliverable.id)}`);
}

export async function setDeliverableStatus(id: string, status: string) {
  if (!DELIVERABLE_STATUSES.includes(status as (typeof DELIVERABLE_STATUSES)[number])) throw new Error("Choose a valid deliverable status.");
  const { session, organizationId } = await editor(status === "delivered" ? "deliver" : "update");
  const prisma = getPrisma();
  const deliverable = await prisma.$transaction(async (tx) => {
    const existing = await tx.deliverable.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!existing) throw new Error("Deliverable not found.");
    const updated = await tx.deliverable.update({ where: { id }, data: { status, deliveredAt: status === "delivered" ? new Date() : null } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: status, resource: "deliverable", resourceId: updated.id });
    return updated;
  });
  revalidatePath("/studio/deliverables");
  revalidatePath(`/studio/projects/${deliverable.projectId}`);
  redirect(`/studio/deliverables?status=${encodeURIComponent(status)}`);
}

export async function createDeliverableLink(id: string, formData: FormData) {
  const { session, organizationId } = await editor("deliver");
  const days = Number(formText(formData, "expiresInDays") || "14");
  if (![7, 14, 30, 90].includes(days)) throw new Error("Choose a valid link expiry.");
  const token = randomBytes(24).toString("base64url");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.deliverable.findFirst({ where: { id, organizationId }, select: { id: true, title: true } });
    if (!existing) throw new Error("Deliverable not found.");
    await tx.deliverable.update({
      where: { id },
      data: {
        deliveryToken: token,
        deliveryCreatedAt: new Date(),
        deliveryExpiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        deliveryRevokedAt: null,
      },
    });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "shared", resource: "deliverable", resourceId: id, metadata: { title: existing.title, days } });
  });
  revalidatePath("/studio/deliverables");
  redirect(`/studio/deliverables?link=created`);
}

export async function revokeDeliverableLink(id: string) {
  const { session, organizationId } = await editor("deliver");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.deliverable.findFirst({ where: { id, organizationId }, select: { id: true, title: true } });
    if (!existing) throw new Error("Deliverable not found.");
    await tx.deliverable.update({ where: { id }, data: { deliveryRevokedAt: new Date() } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "revoked", resource: "deliverable", resourceId: id, metadata: { title: existing.title } });
  });
  revalidatePath("/studio/deliverables");
  redirect(`/studio/deliverables?link=revoked`);
}
