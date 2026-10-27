"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/forms";
import { notificationErrorMessage, sendInquiryNotification } from "@/lib/inquiries/notifications";

const INQUIRY_STATUSES = ["new", "reviewed", "archived", "converted"] as const;

export async function retryInquiryNotification(id: string) {
  const access = await requireStudioAction({ inquiry: ["update"] });
  const prisma = getPrisma();
  const inquiry = await prisma.inquiry.findFirst({ where: { id, organizationId: access.organizationId }, select: { id: true, name: true, email: true, serviceSlug: true, eventDate: true, location: true, details: true } });
  if (!inquiry) throw new Error("Inquiry not found.");
  try {
    await sendInquiryNotification(inquiry);
    await prisma.$transaction(async (tx) => {
      await tx.inquiry.update({ where: { id }, data: { notificationStatus: "sent", notificationSentAt: new Date(), notificationError: null } });
      await writeAudit(tx, { organizationId: access.organizationId, actorUserId: access.session.user.id, action: "notification_sent", resource: "inquiry", resourceId: id });
    });
  } catch (error) {
    const message = notificationErrorMessage(error);
    await prisma.$transaction(async (tx) => {
      await tx.inquiry.update({ where: { id }, data: { notificationStatus: "failed", notificationError: message } });
      await writeAudit(tx, { organizationId: access.organizationId, actorUserId: access.session.user.id, action: "notification_failed", resource: "inquiry", resourceId: id, metadata: { error: message } });
    });
  }
  revalidatePath("/studio/inquiries");
  redirect(`/studio/inquiries?notification=${encodeURIComponent(id)}`);
}

export async function updateInquiryStatus(id: string, status: string, formData: FormData) {
  void formData;
  if (!INQUIRY_STATUSES.includes(status as (typeof INQUIRY_STATUSES)[number])) throw new Error("Choose a valid inquiry status.");
  const access = await requireStudioAction({ inquiry: ["update"] });
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findFirst({ where: { id, organizationId: access.organizationId }, select: { id: true } });
    if (!inquiry) throw new Error("Inquiry not found.");
    await tx.inquiry.update({ where: { id }, data: { status } });
    await writeAudit(tx, { organizationId: access.organizationId, actorUserId: access.session.user.id, action: "updated", resource: "inquiry", resourceId: id, metadata: { status } });
  });
  revalidatePath("/studio/inquiries");
  revalidatePath("/studio");
  redirect(`/studio/inquiries?status=${encodeURIComponent(status)}`);
}

async function uniqueProjectSlug(organizationId: string, base: string) {
  const prisma = getPrisma();
  const root = slugify(base) || "project";
  let candidate = root;
  let index = 1;
  while (await prisma.project.findFirst({ where: { organizationId, slug: candidate }, select: { id: true } })) {
    index += 1;
    candidate = `${root}-${index}`;
  }
  return candidate;
}

export async function convertInquiryToClientProject(id: string) {
  const access = await requireStudioAction({ inquiry: ["update"], client: ["create"], project: ["create"] });
  const prisma = getPrisma();
  const inquiry = await prisma.inquiry.findFirst({ where: { id, organizationId: access.organizationId } });
  if (!inquiry) throw new Error("Inquiry not found.");
  if (inquiry.status === "converted") throw new Error("This inquiry has already been converted.");

  const service = await prisma.service.findFirst({ where: { organizationId: access.organizationId, slug: inquiry.serviceSlug }, select: { id: true, name: true } });
  const projectName = `${service?.name ?? inquiry.serviceSlug} — ${inquiry.name}`;
  const slug = await uniqueProjectSlug(access.organizationId, projectName);

  const project = await prisma.$transaction(async (tx) => {
    const client = inquiry.email
      ? await tx.client.findFirst({ where: { organizationId: access.organizationId, email: inquiry.email } })
      : null;
    const clientRecord = client ?? await tx.client.create({
      data: {
        organizationId: access.organizationId,
        name: inquiry.name,
        email: inquiry.email,
        notes: `Created from inquiry ${inquiry.id}.`,
      },
    });

    const created = await tx.project.create({
      data: {
        organizationId: access.organizationId,
        clientId: clientRecord.id,
        serviceId: service?.id ?? null,
        slug,
        name: projectName,
        description: inquiry.details,
        status: "planning",
        startDate: inquiry.eventDate,
      },
    });
    await tx.inquiry.update({ where: { id }, data: { status: "converted" } });
    await writeAudit(tx, {
      organizationId: access.organizationId,
      actorUserId: access.session.user.id,
      action: "converted",
      resource: "inquiry",
      resourceId: id,
      metadata: { projectId: created.id, clientId: clientRecord.id },
    });
    return created;
  });

  revalidatePath("/studio/inquiries");
  revalidatePath("/studio/projects");
  revalidatePath("/studio/clients");
  redirect(`/studio/projects/${project.id}?converted=yes`);
}
