"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formDate, formText, optionalText, optionalTextLimit, requireSlug, requireText, slugify } from "@/lib/forms";
import { createMediaDerivatives, deleteMediaFiles, getMediaMetadata, MAX_MEDIA_BYTES, mediaExtension } from "@/lib/storage/blob";

async function editor(permission: "upload" | "update" | "delete" | "share") {
  const access = await requireStudioAction({ media: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

async function assertProject(organizationId: string, projectId: string | null) {
  if (!projectId) return null;
  const project = await getPrisma().project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } });
  if (!project) throw new Error("Choose a project from this workspace.");
  return project.id;
}

export async function finalizeMediaUpload(input: { pathname: string; filename: string; projectId: string; visibility: string }) {
  const { session, organizationId } = await editor("upload");
  const { pathname } = input;
  if (!/^media\/[a-f0-9-]{36}\.[a-z0-9]+$/.test(pathname)) throw new Error("Invalid uploaded file.");
  const metadata = await getMediaMetadata(pathname);
  const extension = mediaExtension(metadata.contentType);
  if (!extension || metadata.size < 1 || metadata.size > MAX_MEDIA_BYTES || !pathname.endsWith(extension)) {
    await deleteMediaFiles([pathname]);
    throw new Error("The uploaded file type or size is not supported.");
  }
  const projectId = await assertProject(organizationId, input.projectId || null);
  const visibility = input.visibility === "public" ? "public" : "private";
  const filename = input.filename.split(/[\\/]/).pop()?.slice(0, 180) || `upload${extension}`;
  const derivatives = await createMediaDerivatives(pathname, metadata.contentType);
  const prisma = getPrisma();
  try {
    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.mediaAsset.create({
        data: {
          organizationId, projectId, filename, mimeType: metadata.contentType, byteSize: metadata.size,
          storageKey: pathname, ...(derivatives ?? {}), visibility,
        },
      });
      await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "uploaded", resource: "media_asset", resourceId: created.id, metadata: { filename: created.filename, visibility } });
      return created;
    });
    revalidatePath("/studio/media");
    if (projectId) revalidatePath(`/studio/projects/${projectId}`);
    return { id: asset.id };
  } catch (error) {
    await deleteMediaFiles([pathname, derivatives?.derivativeKey, derivatives?.thumbnailKey]);
    throw error;
  }
}

export async function discardUnregisteredMediaUpload(pathname: string) {
  const { organizationId } = await editor("upload");
  if (!/^media\/[a-f0-9-]{36}\.[a-z0-9]+$/.test(pathname)) return;
  const existing = await getPrisma().mediaAsset.findFirst({ where: { organizationId, storageKey: pathname }, select: { id: true } });
  if (!existing) await deleteMediaFiles([pathname]);
}

export async function setMediaVisibility(id: string, visibility: string) {
  if (!["private", "public"].includes(visibility)) throw new Error("Choose a valid visibility.");
  const { session, organizationId } = await editor("update");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!asset) throw new Error("Media asset not found.");
    await tx.mediaAsset.update({ where: { id }, data: { visibility } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "media_asset", resourceId: id, metadata: { visibility } });
  });
  revalidatePath("/studio/media");
  redirect(`/studio/media?visibility=${encodeURIComponent(visibility)}`);
}

export async function deleteMediaAsset(id: string) {
  const { session, organizationId } = await editor("delete");
  const prisma = getPrisma();
  const asset = await prisma.$transaction(async (tx) => {
    const existing = await tx.mediaAsset.findFirst({ where: { id, organizationId }, select: { id: true, storageKey: true, derivativeKey: true, thumbnailKey: true, filename: true } });
    if (!existing) throw new Error("Media asset not found.");
    await tx.mediaAsset.delete({ where: { id } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "deleted", resource: "media_asset", resourceId: id, metadata: { filename: existing.filename } });
    return existing;
  });
  await deleteMediaFiles([asset.storageKey, asset.derivativeKey, asset.thumbnailKey]);
  revalidatePath("/studio/media");
  redirect("/studio/media?deleted=yes");
}

export async function createGallery(formData: FormData) {
  const { session, organizationId } = await editor("upload");
  const title = requireText(formText(formData, "title"), "Gallery title", 2, 160);
  const slug = requireSlug(formText(formData, "slug") || slugify(title), "gallery slug");
  const projectId = await assertProject(organizationId, optionalText(formData, "projectId"));
  const visibility = formText(formData, "visibility") === "public" ? "public" : "private";
  const prisma = getPrisma();
  const gallery = await prisma.$transaction(async (tx) => {
    const created = await tx.gallery.create({
      data: { organizationId, projectId, slug, title, description: optionalTextLimit(optionalText(formData, "description"), "Description", 2000), visibility },
    });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "gallery", resourceId: created.id, metadata: { slug: created.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "gallery", resourceId: created.id, action: "created", snapshot: { title, slug, projectId, visibility } });
    return created;
  });
  revalidatePath("/studio/media");
  redirect(`/studio/media?galleryCreated=${encodeURIComponent(gallery.slug)}`);
}

export async function addGalleryAsset(galleryId: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const mediaAssetId = requireText(formText(formData, "mediaAssetId"), "Media asset", 1, 100);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const [gallery, asset] = await Promise.all([
      tx.gallery.findFirst({ where: { id: galleryId, organizationId }, select: { id: true } }),
      tx.mediaAsset.findFirst({ where: { id: mediaAssetId, organizationId }, select: { id: true } }),
    ]);
    if (!gallery || !asset) throw new Error("Choose media and a gallery from this workspace.");
    const existing = await tx.galleryAsset.findFirst({ where: { galleryId, mediaAssetId }, select: { id: true } });
    if (existing) throw new Error("That asset is already in this gallery.");
    const count = await tx.galleryAsset.count({ where: { galleryId } });
    await tx.galleryAsset.create({ data: { galleryId, mediaAssetId, sortOrder: count } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "gallery", resourceId: galleryId, metadata: { mediaAssetId } });
  });
  revalidatePath("/studio/media");
  redirect(`/studio/media?gallery=${encodeURIComponent(galleryId)}`);
}

export async function removeGalleryAsset(galleryId: string, galleryAssetId: string) {
  const { session, organizationId } = await editor("update");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const gallery = await tx.gallery.findFirst({ where: { id: galleryId, organizationId }, select: { id: true } });
    if (!gallery) throw new Error("Gallery not found.");
    await tx.galleryAsset.delete({ where: { id: galleryAssetId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "gallery", resourceId: galleryId, metadata: { removedAsset: galleryAssetId } });
  });
  revalidatePath("/studio/media");
  redirect(`/studio/media?gallery=${encodeURIComponent(galleryId)}`);
}

export async function setGalleryPublication(id: string, publish: boolean) {
  const { session, organizationId } = await editor("share");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const gallery = await tx.gallery.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!gallery) throw new Error("Gallery not found.");
    await tx.gallery.update({ where: { id }, data: { status: publish ? "published" : "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: publish ? "published" : "unpublished", resource: "gallery", resourceId: id });
  });
  revalidatePath("/studio/media");
  redirect(`/studio/media?${publish ? "galleryPublished" : "galleryUnpublished"}=yes`);
}

export async function createShareGrant(galleryId: string | null, mediaAssetId: string | null, formData: FormData) {
  const { session, organizationId } = await editor("share");
  const expiresAt = formDate(formData, "expiresAt");
  if (!galleryId && !mediaAssetId) throw new Error("Choose a gallery or media asset to share.");
  const prisma = getPrisma();
  if (galleryId && !(await prisma.gallery.findFirst({ where: { id: galleryId, organizationId }, select: { id: true } }))) throw new Error("Gallery not found.");
  if (mediaAssetId && !(await prisma.mediaAsset.findFirst({ where: { id: mediaAssetId, organizationId }, select: { id: true } }))) throw new Error("Media asset not found.");
  const token = randomBytes(24).toString("base64url");
  await prisma.$transaction(async (tx) => {
    const grant = await tx.shareGrant.create({ data: { organizationId, galleryId, mediaAssetId, createdByUserId: session.user.id, token, expiresAt } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "shared", resource: "share_grant", resourceId: grant.id, metadata: { galleryId, mediaAssetId, expiresAt: expiresAt?.toISOString() ?? null } });
  });
  revalidatePath("/studio/media");
  redirect(`/studio/media?shareToken=${encodeURIComponent(token)}`);
}

export async function revokeShareGrant(id: string) {
  const { session, organizationId } = await editor("share");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const grant = await tx.shareGrant.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!grant) throw new Error("Share grant not found.");
    await tx.shareGrant.update({ where: { id }, data: { revokedAt: new Date() } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "revoked", resource: "share_grant", resourceId: id });
  });
  revalidatePath("/studio/media");
  redirect("/studio/media?revoked=yes");
}
