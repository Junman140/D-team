"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formInt, formText, optionalText, optionalTextLimit, requireText } from "@/lib/forms";

function linkFields(formData: FormData) {
  const platform = requireText(formText(formData, "platform"), "Platform", 2, 80);
  const label = optionalTextLimit(optionalText(formData, "label"), "Label", 120);
  const url = requireText(formText(formData, "url"), "URL", 8, 1000);
  if (!/^https:\/\//i.test(url)) throw new Error("Social URLs must use HTTPS.");
  return { platform, label, url, sortOrder: formInt(formData, "sortOrder") };
}

async function editor(permission: "create" | "update" | "publish") {
  const access = await requireStudioAction({ content: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

function revalidateSocial() {
  revalidatePath("/studio/content/social");
  revalidatePath("/socials");
  revalidatePath("/");
}

export async function createSocialLink(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = linkFields(formData);
  const prisma = getPrisma();
  const link = await prisma.$transaction(async (tx) => {
    const created = await tx.socialLink.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "social_link", resourceId: created.id, metadata: { platform: created.platform } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "social_link", resourceId: created.id, action: "created", snapshot: data });
    return created;
  });
  revalidateSocial();
  redirect(`/studio/content/social?created=${encodeURIComponent(link.id)}`);
}

export async function updateSocialLink(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = linkFields(formData);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.socialLink.update({ where: { id, organizationId }, data: { ...data, status: "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "social_link", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "social_link", resourceId: updated.id, action: "updated", snapshot: data });
  });
  revalidateSocial();
  redirect(`/studio/content/social?updated=${encodeURIComponent(id)}`);
}

export async function setSocialLinkPublication(id: string, publish: boolean) {
  const { session, organizationId } = await editor("publish");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.socialLink.update({ where: { id, organizationId }, data: { status: publish ? "published" : "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: publish ? "published" : "unpublished", resource: "social_link", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "social_link", resourceId: updated.id, action: publish ? "published" : "unpublished" });
  });
  revalidateSocial();
  redirect(`/studio/content/social?${publish ? "published" : "unpublished"}=${encodeURIComponent(id)}`);
}

export async function deleteSocialLink(id: string) {
  const { session, organizationId } = await editor("update");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const link = await tx.socialLink.delete({ where: { id, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "deleted", resource: "social_link", resourceId: id, metadata: { platform: link.platform } });
  });
  revalidateSocial();
  redirect("/studio/content/social?deleted=yes");
}
