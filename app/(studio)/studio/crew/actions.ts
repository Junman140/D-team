"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formDate, formText, optionalText, optionalTextLimit, parseListLines, requireText } from "@/lib/forms";
import { isCrewDepartment } from "@/features/crew/departments";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function crewFields(formData: FormData) {
  const name = requireText(formText(formData, "name"), "Crew name", 2, 160);
  const role = requireText(formText(formData, "role"), "Crew role", 2, 120);
  const email = optionalTextLimit(optionalText(formData, "email"), "Email", 254)?.toLowerCase() ?? null;
  if (email && !EMAIL_PATTERN.test(email)) throw new Error("Enter a valid crew email.");
  const primaryDepartment = optionalTextLimit(optionalText(formData, "department"), "Department", 120);
  const departments = Array.from(new Set([
    ...formData.getAll("departments").filter((value): value is string => typeof value === "string" && isCrewDepartment(value)),
    ...(primaryDepartment ? [primaryDepartment] : []),
  ])).slice(0, 13);
  return {
    name,
    role,
    department: primaryDepartment || departments[0] || null,
    departments,
    skills: parseListLines(formText(formData, "skills")).slice(0, 40),
    email,
    phone: optionalTextLimit(optionalText(formData, "phone"), "Phone", 80),
    status: formText(formData, "status") === "inactive" ? "inactive" : "active",
    userId: optionalText(formData, "userId"),
  };
}

async function editor(permission: "update" | "assign") {
  const access = await requireStudioAction({ crew: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

export async function createCrewProfile(formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = crewFields(formData);
  const prisma = getPrisma();
  if (data.userId && !(await prisma.member.findFirst({ where: { organizationId, userId: data.userId }, select: { id: true } }))) throw new Error("Choose a staff account from this workspace.");
  const crew = await prisma.$transaction(async (tx) => {
    const created = await tx.crewProfile.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "crew_profile", resourceId: created.id, metadata: { name: created.name } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "crew_profile", resourceId: created.id, action: "created", snapshot: data });
    return created;
  });
  revalidatePath("/studio/crew");
  redirect(`/studio/crew?created=${encodeURIComponent(crew.id)}`);
}

export async function updateCrewProfile(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = crewFields(formData);
  const prisma = getPrisma();
  if (data.userId && !(await prisma.member.findFirst({ where: { organizationId, userId: data.userId }, select: { id: true } }))) throw new Error("Choose a staff account from this workspace.");
  const crew = await prisma.$transaction(async (tx) => {
    const updated = await tx.crewProfile.update({ where: { id, organizationId }, data });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "crew_profile", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "crew_profile", resourceId: updated.id, action: "updated", snapshot: data });
    return updated;
  });
  revalidatePath("/studio/crew");
  redirect(`/studio/crew?updated=${encodeURIComponent(crew.id)}`);
}

export async function addCrewAvailability(crewProfileId: string, formData: FormData) {
  const { session, organizationId } = await editor("assign");
  const startsAt = formDate(formData, "startsAt");
  const endsAt = formDate(formData, "endsAt");
  if (!startsAt || !endsAt) throw new Error("Enter availability start and end times.");
  if (endsAt <= startsAt) throw new Error("Availability end must be after the start.");
  const status = formText(formData, "status") === "unavailable" ? "unavailable" : "available";
  const note = optionalTextLimit(optionalText(formData, "note"), "Note", 500);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const crew = await tx.crewProfile.findFirst({ where: { id: crewProfileId, organizationId }, select: { id: true } });
    if (!crew) throw new Error("Crew profile not found.");
    const entry = await tx.crewAvailability.create({ data: { crewProfileId, startsAt, endsAt, status, note } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "crew_availability", resourceId: entry.id, metadata: { crewProfileId, status } });
  });
  revalidatePath("/studio/crew");
  revalidatePath("/studio/calendar");
  redirect(`/studio/crew?availability=${encodeURIComponent(crewProfileId)}`);
}

export async function deleteCrewAvailability(crewProfileId: string, id: string) {
  const { session, organizationId } = await editor("assign");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const crew = await tx.crewProfile.findFirst({ where: { id: crewProfileId, organizationId }, select: { id: true } });
    if (!crew) throw new Error("Crew profile not found.");
    await tx.crewAvailability.delete({ where: { id } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "deleted", resource: "crew_availability", resourceId: id, metadata: { crewProfileId } });
  });
  revalidatePath("/studio/crew");
  revalidatePath("/studio/calendar");
  redirect(`/studio/crew?availabilityRemoved=yes`);
}
