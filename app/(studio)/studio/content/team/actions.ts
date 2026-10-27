"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formInt, formText, optionalText, optionalTextLimit, requireSlug, requireText, slugify } from "@/lib/forms";

function memberFields(formData: FormData) {
  const name = requireText(formText(formData, "name"), "Name", 2, 120);
  const slug = requireSlug(formText(formData, "slug") || slugify(name), "team slug");
  const role = requireText(formText(formData, "role"), "Role", 2, 120);
  const department = optionalTextLimit(optionalText(formData, "department"), "Department", 120);
  const bio = optionalTextLimit(optionalText(formData, "bio"), "Bio", 4000);
  const portraitUrl = optionalTextLimit(optionalText(formData, "portraitUrl"), "Portrait URL", 1000);
  if (portraitUrl && !(portraitUrl.startsWith("/") && !portraitUrl.startsWith("//")) && !/^https:\/\//i.test(portraitUrl)) {
    throw new Error("Portrait must use a site path or HTTPS URL.");
  }
  return { name, slug, role, department, bio, portraitUrl, sortOrder: formInt(formData, "sortOrder") };
}

async function editor(permission: "create" | "update" | "publish") {
  const access = await requireStudioAction({ content: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

function revalidateTeam(slug?: string) {
  revalidatePath("/studio/content/team");
  revalidatePath("/team");
  revalidatePath("/");
  if (slug) revalidatePath(`/team/${slug}`);
}

export async function createTeamMember(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = memberFields(formData);
  const prisma = getPrisma();
  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.teamMember.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "team_member", resourceId: created.id, metadata: { slug: created.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "team_member", resourceId: created.id, action: "created", snapshot: data });
    return created;
  });
  revalidateTeam(member.slug);
  redirect(`/studio/content/team?created=${encodeURIComponent(member.slug)}`);
}

export async function updateTeamMember(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = memberFields(formData);
  const prisma = getPrisma();
  const member = await prisma.$transaction(async (tx) => {
    const updated = await tx.teamMember.update({ where: { id, organizationId }, data: { ...data, status: "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "team_member", resourceId: updated.id, metadata: { slug: updated.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "team_member", resourceId: updated.id, action: "updated", snapshot: data });
    return updated;
  });
  revalidateTeam(member.slug);
  redirect(`/studio/content/team?updated=${encodeURIComponent(member.slug)}`);
}

export async function setTeamMemberPublication(id: string, publish: boolean) {
  const { session, organizationId } = await editor("publish");
  const prisma = getPrisma();
  const member = await prisma.$transaction(async (tx) => {
    const updated = await tx.teamMember.update({ where: { id, organizationId }, data: { status: publish ? "published" : "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: publish ? "published" : "unpublished", resource: "team_member", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "team_member", resourceId: updated.id, action: publish ? "published" : "unpublished" });
    return updated;
  });
  revalidateTeam(member.slug);
  redirect(`/studio/content/team?${publish ? "published" : "unpublished"}=${encodeURIComponent(member.slug)}`);
}
