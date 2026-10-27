"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formText, optionalText, optionalTextLimit, requireSlug, requireText, slugify } from "@/lib/forms";

function postFields(formData: FormData) {
  const title = requireText(formText(formData, "title"), "Title", 2, 160);
  const slug = requireSlug(formText(formData, "slug") || slugify(title), "journal slug");
  const excerpt = requireText(formText(formData, "excerpt"), "Excerpt", 10, 500);
  const body = requireText(formText(formData, "body"), "Journal body", 20, 30000);
  const coverImageUrl = optionalTextLimit(optionalText(formData, "coverImageUrl"), "Cover image URL", 1000);
  const authorName = optionalTextLimit(optionalText(formData, "authorName"), "Author name", 120);
  if (coverImageUrl && !(coverImageUrl.startsWith("/") && !coverImageUrl.startsWith("//")) && !/^https:\/\//i.test(coverImageUrl)) {
    throw new Error("Cover image must use a site path or HTTPS URL.");
  }
  return { title, slug, excerpt, body, coverImageUrl, authorName };
}

async function editor(permission: "create" | "update" | "publish") {
  const access = await requireStudioAction({ content: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

function revalidatePosts(slug?: string) {
  revalidatePath("/studio/content/journal");
  revalidatePath("/journal");
  if (slug) revalidatePath(`/journal/${slug}`);
}

export async function createJournalPost(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = postFields(formData);
  const prisma = getPrisma();
  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.journalPost.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "journal_post", resourceId: created.id, metadata: { slug: created.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "journal_post", resourceId: created.id, action: "created", snapshot: data });
    return created;
  });
  revalidatePosts(post.slug);
  redirect(`/studio/content/journal?created=${encodeURIComponent(post.slug)}`);
}

export async function updateJournalPost(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = postFields(formData);
  const prisma = getPrisma();
  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.journalPost.update({ where: { id, organizationId }, data: { ...data, status: "draft", publishedAt: null } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "journal_post", resourceId: updated.id, metadata: { slug: updated.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "journal_post", resourceId: updated.id, action: "updated", snapshot: data });
    return updated;
  });
  revalidatePosts(post.slug);
  redirect(`/studio/content/journal?updated=${encodeURIComponent(post.slug)}`);
}

export async function setJournalPostPublication(id: string, publish: boolean) {
  const { session, organizationId } = await editor("publish");
  const prisma = getPrisma();
  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.journalPost.update({
      where: { id, organizationId },
      data: { status: publish ? "published" : "draft", publishedAt: publish ? new Date() : null },
    });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: publish ? "published" : "unpublished", resource: "journal_post", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "journal_post", resourceId: updated.id, action: publish ? "published" : "unpublished" });
    return updated;
  });
  revalidatePosts(post.slug);
  redirect(`/studio/content/journal?${publish ? "published" : "unpublished"}=${encodeURIComponent(post.slug)}`);
}
