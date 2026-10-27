"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit } from "@/lib/audit";
import { formDate, formText, optionalText, optionalTextLimit, requireText } from "@/lib/forms";

async function editor(permission: "create" | "update" | "delete") {
  const access = await requireStudioAction({ schedule: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

function scheduleFields(formData: FormData) {
  const projectId = requireText(formText(formData, "projectId"), "Project", 1, 100);
  const title = requireText(formText(formData, "title"), "Schedule title", 2, 160);
  const startsAt = formDate(formData, "startsAt");
  const endsAt = formDate(formData, "endsAt");
  if (!startsAt || !endsAt) throw new Error("Enter schedule start and end times.");
  if (endsAt <= startsAt) throw new Error("Schedule end must be after the start.");
  return {
    projectId,
    title,
    startsAt,
    endsAt,
    location: optionalTextLimit(optionalText(formData, "location"), "Location", 300),
    notes: optionalTextLimit(optionalText(formData, "notes"), "Notes", 5000),
  };
}

async function assertProject(organizationId: string, projectId: string) {
  const project = await getPrisma().project.findFirst({ where: { id: projectId, organizationId }, select: { id: true, name: true } });
  if (!project) throw new Error("Choose a project from this workspace.");
  return project;
}

export async function createScheduleItem(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = scheduleFields(formData);
  await assertProject(organizationId, data.projectId);
  const prisma = getPrisma();
  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.scheduleItem.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "schedule_item", resourceId: created.id, metadata: { projectId: created.projectId } });
    return created;
  });
  revalidatePath("/studio/calendar");
  revalidatePath(`/studio/projects/${item.projectId}`);
  redirect(`/studio/calendar?created=${encodeURIComponent(item.id)}`);
}

export async function updateScheduleItem(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = scheduleFields(formData);
  await assertProject(organizationId, data.projectId);
  const prisma = getPrisma();
  const item = await prisma.$transaction(async (tx) => {
    const existing = await tx.scheduleItem.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!existing) throw new Error("Schedule item not found.");
    const updated = await tx.scheduleItem.update({ where: { id }, data });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "schedule_item", resourceId: updated.id, metadata: { projectId: updated.projectId } });
    return updated;
  });
  revalidatePath("/studio/calendar");
  revalidatePath(`/studio/projects/${item.projectId}`);
  redirect(`/studio/calendar?updated=${encodeURIComponent(item.id)}`);
}

export async function deleteScheduleItem(id: string) {
  const { session, organizationId } = await editor("delete");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const item = await tx.scheduleItem.findFirst({ where: { id, organizationId }, select: { id: true, projectId: true } });
    if (!item) throw new Error("Schedule item not found.");
    await tx.scheduleItem.delete({ where: { id } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "deleted", resource: "schedule_item", resourceId: id, metadata: { projectId: item.projectId } });
  });
  revalidatePath("/studio/calendar");
  redirect("/studio/calendar?deleted=yes");
}

export async function createCallSheet(scheduleItemId: string | null, formData: FormData) {
  const { session, organizationId } = await editor("create");
  const prisma = getPrisma();
  const projectId = scheduleItemId
    ? (await prisma.scheduleItem.findFirst({ where: { id: scheduleItemId, organizationId }, select: { projectId: true } }))?.projectId
    : requireText(formText(formData, "projectId"), "Project", 1, 100);
  if (!projectId) throw new Error("Choose a schedule item or project.");
  const project = await assertProject(organizationId, projectId);
  const title = formText(formData, "title") || `${project.name} call sheet`;
  const token = randomBytes(24).toString("base64url");
  const callSheet = await prisma.$transaction(async (tx) => {
    const created = await tx.callSheet.create({
      data: {
        organizationId,
        projectId,
        scheduleItemId,
        title,
        shareToken: token,
        details: { location: optionalText(formData, "location"), notes: optionalText(formData, "notes") },
      },
    });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "call_sheet", resourceId: created.id, metadata: { projectId } });
    return created;
  });
  revalidatePath("/studio/calendar");
  redirect(`/studio/calendar/call-sheets/${callSheet.shareToken}`);
}
