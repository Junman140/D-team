"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formDate, formText, optionalText, optionalTextLimit, requireSlug, requireText, slugify } from "@/lib/forms";

const PROJECT_STATUSES = ["planning", "active", "on-hold", "wrapped", "cancelled"] as const;
const MILESTONE_STATUSES = ["planned", "in-progress", "complete", "blocked"] as const;

async function uniqueSlug(organizationId: string, base: string, excludeId?: string) {
  const prisma = getPrisma();
  const root = requireSlug(slugify(base) || "project");
  let candidate = root;
  let index = 1;
  while (await prisma.project.findFirst({ where: { organizationId, slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } })) {
    index += 1;
    candidate = `${root}-${index}`;
  }
  return candidate;
}

async function projectFields(formData: FormData, organizationId: string, excludeId?: string) {
  const name = requireText(formText(formData, "name"), "Project name", 2, 160);
  const slug = formText(formData, "slug") ? requireSlug(formText(formData, "slug"), "project slug") : await uniqueSlug(organizationId, name, excludeId);
  const status = formText(formData, "status") || "planning";
  if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) throw new Error("Choose a valid project status.");
  const startDate = formDate(formData, "startDate");
  const endDate = formDate(formData, "endDate");
  if (startDate && endDate && endDate < startDate) throw new Error("The end date cannot be before the start date.");
  const budget = formText(formData, "budgetAmount");
  const budgetAmount = budget ? Math.round(Number(budget) * 100) : null;
  if (budget && (!Number.isFinite(budgetAmount) || budgetAmount! < 0)) throw new Error("Enter a valid budget.");
  const currency = (formText(formData, "currency") || "NGN").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Use a three-letter currency code.");
  return {
    name,
    slug,
    description: optionalTextLimit(optionalText(formData, "description"), "Description", 10000),
    status,
    startDate,
    endDate,
    budgetAmount,
    currency,
    clientId: optionalText(formData, "clientId"),
    serviceId: optionalText(formData, "serviceId"),
    leadUserId: optionalText(formData, "leadUserId"),
  };
}

async function editor(permission: "create" | "update" | "delete" | "assign") {
  const access = await requireStudioAction({ project: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

async function assertRelations(organizationId: string, data: { clientId: string | null; serviceId: string | null; leadUserId: string | null }) {
  const prisma = getPrisma();
  if (data.clientId && !(await prisma.client.findFirst({ where: { id: data.clientId, organizationId }, select: { id: true } }))) throw new Error("Choose a client from this workspace.");
  if (data.serviceId && !(await prisma.service.findFirst({ where: { id: data.serviceId, organizationId }, select: { id: true } }))) throw new Error("Choose a service from this workspace.");
  if (data.leadUserId && !(await prisma.member.findFirst({ where: { userId: data.leadUserId, organizationId }, select: { id: true } }))) throw new Error("Choose a project lead from this workspace.");
}

export async function createProject(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = await projectFields(formData, organizationId);
  await assertRelations(organizationId, data);
  const prisma = getPrisma();
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "project", resourceId: created.id, metadata: { name: created.name } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "project", resourceId: created.id, action: "created", snapshot: data });
    return created;
  });
  revalidatePath("/studio/projects");
  redirect(`/studio/projects/${project.id}?created=yes`);
}

export async function updateProject(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = await projectFields(formData, organizationId, id);
  await assertRelations(organizationId, data);
  const prisma = getPrisma();
  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({ where: { id, organizationId }, data });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "project", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "project", resourceId: updated.id, action: "updated", snapshot: data });
    return updated;
  });
  revalidatePath("/studio/projects");
  revalidatePath(`/studio/projects/${id}`);
  redirect(`/studio/projects/${project.id}?updated=yes`);
}

export async function addProjectMember(projectId: string, formData: FormData) {
  const { session, organizationId } = await editor("assign");
  const crewProfileId = optionalText(formData, "crewProfileId");
  const role = requireText(formText(formData, "role"), "Project role", 2, 120);
  if (!crewProfileId) throw new Error("Choose a crew profile.");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true, name: true } });
    if (!project) throw new Error("Project not found.");
    const crew = await tx.crewProfile.findFirst({ where: { id: crewProfileId, organizationId }, select: { id: true, name: true } });
    if (!crew) throw new Error("Choose a crew profile from this workspace.");
    const member = await tx.projectMember.create({ data: { projectId, crewProfileId, role } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "assigned", resource: "project_member", resourceId: member.id, metadata: { projectId, crewProfileId, role } });
  });
  revalidatePath(`/studio/projects/${projectId}`);
  redirect(`/studio/projects/${projectId}?memberAdded=yes`);
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const { session, organizationId } = await editor("assign");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } });
    if (!project) throw new Error("Project not found.");
    await tx.projectMember.delete({ where: { id: memberId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "unassigned", resource: "project_member", resourceId: memberId, metadata: { projectId } });
  });
  revalidatePath(`/studio/projects/${projectId}`);
  redirect(`/studio/projects/${projectId}?memberRemoved=yes`);
}

function milestoneFields(formData: FormData) {
  const title = requireText(formText(formData, "title"), "Milestone title", 2, 160);
  const status = formText(formData, "status") || "planned";
  if (!MILESTONE_STATUSES.includes(status as (typeof MILESTONE_STATUSES)[number])) throw new Error("Choose a valid milestone status.");
  return {
    title,
    description: optionalTextLimit(optionalText(formData, "description"), "Milestone description", 2000),
    status,
    dueAt: formDate(formData, "dueAt"),
    completedAt: status === "complete" ? new Date() : null,
  };
}

async function assertProjectInWorkspace(organizationId: string, projectId: string) {
  const project = await getPrisma().project.findFirst({ where: { id: projectId, organizationId }, select: { id: true, name: true } });
  if (!project) throw new Error("Project not found.");
  return project;
}

export async function createMilestone(projectId: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = milestoneFields(formData);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true, name: true } });
    if (!project) throw new Error("Project not found.");
    const last = await tx.projectMilestone.findFirst({ where: { projectId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const milestone = await tx.projectMilestone.create({ data: { ...data, organizationId, projectId, sortOrder: (last?.sortOrder ?? 0) + 1 } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "project_milestone", resourceId: milestone.id, metadata: { projectId, title: milestone.title } });
  });
  revalidatePath("/studio");
  revalidatePath(`/studio/projects/${projectId}`);
  redirect(`/studio/projects/${projectId}?milestone=created`);
}

export async function setMilestoneStatus(projectId: string, milestoneId: string, status: string) {
  if (!MILESTONE_STATUSES.includes(status as (typeof MILESTONE_STATUSES)[number])) throw new Error("Choose a valid milestone status.");
  const { session, organizationId } = await editor("update");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await assertProjectInWorkspace(organizationId, projectId);
    const existing = await tx.projectMilestone.findFirst({ where: { id: milestoneId, projectId, organizationId }, select: { id: true, title: true } });
    if (!existing) throw new Error("Milestone not found.");
    await tx.projectMilestone.update({ where: { id: milestoneId }, data: { status, completedAt: status === "complete" ? new Date() : null } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: status, resource: "project_milestone", resourceId: milestoneId, metadata: { projectId, title: existing.title } });
  });
  revalidatePath("/studio");
  revalidatePath(`/studio/projects/${projectId}`);
  redirect(`/studio/projects/${projectId}?milestone=updated`);
}

export async function deleteMilestone(projectId: string, milestoneId: string) {
  const { session, organizationId } = await editor("update");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await assertProjectInWorkspace(organizationId, projectId);
    const existing = await tx.projectMilestone.findFirst({ where: { id: milestoneId, projectId, organizationId }, select: { id: true, title: true } });
    if (!existing) throw new Error("Milestone not found.");
    await tx.projectMilestone.delete({ where: { id: milestoneId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "deleted", resource: "project_milestone", resourceId: milestoneId, metadata: { projectId, title: existing.title } });
  });
  revalidatePath("/studio");
  revalidatePath(`/studio/projects/${projectId}`);
  redirect(`/studio/projects/${projectId}?milestone=deleted`);
}
