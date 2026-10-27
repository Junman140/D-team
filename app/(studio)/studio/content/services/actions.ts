"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formInt, formText, optionalInt, optionalText, optionalTextLimit, parseListLines, requireSlug, requireText, slugify } from "@/lib/forms";

function serviceFields(formData: FormData) {
  const name = requireText(formText(formData, "name"), "Service name", 2, 120);
  const slug = requireSlug(formText(formData, "slug") || slugify(name), "service slug");
  const discipline = requireText(formText(formData, "discipline"), "Discipline", 2, 80);
  const summary = requireText(formText(formData, "summary"), "Summary", 10, 500);
  const description = optionalTextLimit(optionalText(formData, "description"), "Description", 5000);
  return { name, slug, discipline, summary, description, sortOrder: formInt(formData, "sortOrder") };
}

function packageFields(formData: FormData) {
  const name = requireText(formText(formData, "name"), "Package name", 2, 120);
  const slug = requireSlug(formText(formData, "slug") || slugify(name), "package slug");
  const summary = optionalTextLimit(optionalText(formData, "summary"), "Summary", 1000);
  const priceLabel = optionalTextLimit(optionalText(formData, "priceLabel"), "Price label", 120);
  const amount = formText(formData, "priceAmount");
  const priceAmount = amount ? Math.round(Number(amount) * 100) : null;
  if (amount && (!Number.isFinite(priceAmount) || priceAmount! < 0)) throw new Error("Enter a valid package amount.");
  const currency = (formText(formData, "currency") || "NGN").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Use a three-letter currency code.");
  return {
    name,
    slug,
    summary,
    priceLabel,
    priceAmount,
    currency,
    features: parseListLines(formText(formData, "features")).slice(0, 40),
    sortOrder: formInt(formData, "sortOrder"),
    serviceId: optionalText(formData, "serviceId"),
  };
}

async function editor(permission: "create" | "update" | "publish") {
  const access = await requireStudioAction({ content: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

function revalidateServices(slug?: string) {
  revalidatePath("/studio/content/services");
  revalidatePath("/services");
  revalidatePath("/pricing");
  revalidatePath("/");
  if (slug) revalidatePath(`/services/${slug}`);
}

async function assertService(organizationId: string, serviceId: string | null) {
  if (!serviceId) return null;
  const service = await getPrisma().service.findFirst({ where: { id: serviceId, organizationId }, select: { id: true, slug: true } });
  if (!service) throw new Error("Choose a service from this workspace.");
  return service;
}

export async function createService(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = serviceFields(formData);
  const prisma = getPrisma();
  const service = await prisma.$transaction(async (tx) => {
    const created = await tx.service.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "service", resourceId: created.id, metadata: { slug: created.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "service", resourceId: created.id, action: "created", snapshot: data });
    return created;
  });
  revalidateServices(service.slug);
  redirect(`/studio/content/services?created=${encodeURIComponent(service.slug)}`);
}

export async function updateService(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = serviceFields(formData);
  const prisma = getPrisma();
  const service = await prisma.$transaction(async (tx) => {
    const updated = await tx.service.update({ where: { id, organizationId }, data: { ...data, status: "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "service", resourceId: updated.id, metadata: { slug: updated.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "service", resourceId: updated.id, action: "updated", snapshot: data });
    return updated;
  });
  revalidateServices(service.slug);
  redirect(`/studio/content/services?updated=${encodeURIComponent(service.slug)}`);
}

export async function setServicePublication(id: string, publish: boolean) {
  const { session, organizationId } = await editor("publish");
  const prisma = getPrisma();
  const service = await prisma.$transaction(async (tx) => {
    const updated = await tx.service.update({ where: { id, organizationId }, data: { status: publish ? "published" : "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: publish ? "published" : "unpublished", resource: "service", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "service", resourceId: updated.id, action: publish ? "published" : "unpublished" });
    return updated;
  });
  revalidateServices(service.slug);
  redirect(`/studio/content/services?${publish ? "published" : "unpublished"}=${encodeURIComponent(service.slug)}`);
}

export async function createPackage(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = packageFields(formData);
  await assertService(organizationId, data.serviceId);
  const prisma = getPrisma();
  const created = await prisma.$transaction(async (tx) => {
    const entry = await tx.servicePackage.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "service_package", resourceId: entry.id, metadata: { slug: entry.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "service_package", resourceId: entry.id, action: "created", snapshot: data });
    return entry;
  });
  revalidateServices();
  redirect(`/studio/content/services?packageCreated=${encodeURIComponent(created.slug)}`);
}

export async function updatePackage(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = packageFields(formData);
  await assertService(organizationId, data.serviceId);
  const prisma = getPrisma();
  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.servicePackage.update({ where: { id, organizationId }, data: { ...data, status: "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "service_package", resourceId: entry.id, metadata: { slug: entry.slug } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "service_package", resourceId: entry.id, action: "updated", snapshot: data });
    return entry;
  });
  revalidateServices();
  redirect(`/studio/content/services?packageUpdated=${encodeURIComponent(updated.slug)}`);
}

export async function setPackagePublication(id: string, publish: boolean) {
  const { session, organizationId } = await editor("publish");
  const prisma = getPrisma();
  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.servicePackage.update({ where: { id, organizationId }, data: { status: publish ? "published" : "draft" } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: publish ? "published" : "unpublished", resource: "service_package", resourceId: entry.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "service_package", resourceId: entry.id, action: publish ? "published" : "unpublished" });
    return entry;
  });
  revalidateServices();
  redirect(`/studio/content/services?${publish ? "packagePublished" : "packageUnpublished"}=${encodeURIComponent(updated.slug)}`);
}

export async function deletePackage(id: string) {
  const { session, organizationId } = await editor("update");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const entry = await tx.servicePackage.delete({ where: { id, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "deleted", resource: "service_package", resourceId: id, metadata: { slug: entry.slug } });
  });
  revalidateServices();
  redirect("/studio/content/services?packageDeleted=yes");
}
