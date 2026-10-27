"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { portfolioCategories, type PortfolioCategory } from "@/features/portfolio/projects";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeRevision, writeAudit } from "@/lib/audit";
import { parseCreditLines, parseMediaLines } from "@/lib/forms";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function entryFields(formData: FormData) {
  const title = value(formData, "title");
  const summary = value(formData, "summary");
  const suppliedSlug = value(formData, "slug");
  const slug = (suppliedSlug || title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const categories = formData.getAll("categories").filter(
    (category): category is PortfolioCategory => typeof category === "string" && portfolioCategories.includes(category as PortfolioCategory),
  );
  const rawYear = value(formData, "productionYear");
  const productionYear = rawYear ? Number(rawYear) : null;
  const coverImageUrl = value(formData, "coverImageUrl") || null;
  const clientCredit = value(formData, "clientCredit") || null;
  const brief = value(formData, "brief") || null;
  const approach = value(formData, "approach") || null;
  const outcome = value(formData, "outcome") || null;

  if (title.length < 2 || title.length > 120) throw new Error("Title must be between 2 and 120 characters.");
  if (summary.length < 10 || summary.length > 900) throw new Error("Summary must be between 10 and 900 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) throw new Error("Use a valid lowercase URL slug.");
  if (!categories.length) throw new Error("Choose at least one project category.");
  if (rawYear && (!Number.isInteger(productionYear) || productionYear! < 1900 || productionYear! > 2100)) {
    throw new Error("Enter a valid production year.");
  }
  if (clientCredit && clientCredit.length > 240) throw new Error("Client or credit line must be 240 characters or fewer.");
  if ([brief, approach, outcome].some((section) => section && section.length > 5000)) {
    throw new Error("Each case-study section must be 5000 characters or fewer.");
  }
  if (coverImageUrl && coverImageUrl.length > 1000) throw new Error("Cover image URL must be 1000 characters or fewer.");
  if (coverImageUrl && !(coverImageUrl.startsWith("/") && !coverImageUrl.startsWith("//")) && !/^https:\/\//i.test(coverImageUrl)) {
    throw new Error("Cover image must use a site path or HTTPS URL.");
  }

  return {
    slug,
    title,
    summary,
    categories,
    clientCredit,
    productionYear,
    brief,
    approach,
    outcome,
    coverImageUrl,
  };
}

async function editor(permission: "create" | "update" | "publish") {
  const access = await requireStudioAction({ content: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

export async function createPortfolioEntry(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = entryFields(formData);
  const media = parseMediaLines(value(formData, "media"));
  const credits = parseCreditLines(value(formData, "credits"));
  const prisma = getPrisma();
  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.portfolioEntry.create({
      data: {
        ...data,
        organizationId,
        media: { create: media.map((item, index) => ({ ...item, sortOrder: index })) },
        credits: { create: credits.map((item, index) => ({ ...item, sortOrder: index })) },
      },
    });
    await writeAudit(tx, {
      organizationId,
      actorUserId: session.user.id,
      action: "created",
      resource: "portfolio_entry",
      resourceId: created.id,
      metadata: { slug: created.slug, status: created.status },
    });
    await writeRevision(tx, {
      organizationId,
      actorUserId: session.user.id,
      resourceType: "portfolio_entry",
      resourceId: created.id,
      action: "created",
      snapshot: { ...data, media, credits },
    });
    return created;
  });
  revalidatePath("/studio/content");
  redirect(`/studio/content?created=${encodeURIComponent(entry.slug)}`);
}

export async function updatePortfolioEntry(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = entryFields(formData);
  const media = parseMediaLines(value(formData, "media"));
  const credits = parseCreditLines(value(formData, "credits"));
  const prisma = getPrisma();
  const entry = await prisma.$transaction(async (tx) => {
    const updated = await tx.portfolioEntry.update({
      where: { id, organizationId },
      data: {
        ...data,
        status: "draft",
        publishedAt: null,
        media: { deleteMany: {}, create: media.map((item, index) => ({ ...item, sortOrder: index })) },
        credits: { deleteMany: {}, create: credits.map((item, index) => ({ ...item, sortOrder: index })) },
      },
    });
    await writeAudit(tx, {
      organizationId,
      actorUserId: session.user.id,
      action: "updated",
      resource: "portfolio_entry",
      resourceId: updated.id,
      metadata: { slug: updated.slug, status: updated.status },
    });
    await writeRevision(tx, {
      organizationId,
      actorUserId: session.user.id,
      resourceType: "portfolio_entry",
      resourceId: updated.id,
      action: "updated",
      snapshot: { ...data, media, credits },
    });
    return updated;
  });
  revalidatePath("/studio/content");
  revalidatePath("/work");
  revalidatePath(`/work/${entry.slug}`);
  revalidatePath("/");
  redirect(`/studio/content?updated=${encodeURIComponent(entry.slug)}`);
}

export async function setPortfolioEntryPublication(id: string, publish: boolean, formData: FormData) {
  const { session, organizationId } = await editor("publish");
  if (publish && value(formData, "publicationConfirmed") !== "yes") {
    throw new Error("Confirm that this project text and its assets are approved for public use before publishing.");
  }

  const prisma = getPrisma();
  const entry = await prisma.$transaction(async (tx) => {
    const updated = await tx.portfolioEntry.update({
      where: { id, organizationId },
      data: { status: publish ? "published" : "draft", publishedAt: publish ? new Date() : null },
    });
    await writeAudit(tx, {
      organizationId,
      actorUserId: session.user.id,
      action: publish ? "published" : "unpublished",
      resource: "portfolio_entry",
      resourceId: updated.id,
      metadata: { slug: updated.slug },
    });
    await writeRevision(tx, {
      organizationId,
      actorUserId: session.user.id,
      resourceType: "portfolio_entry",
      resourceId: updated.id,
      action: publish ? "published" : "unpublished",
      snapshot: { slug: updated.slug, status: updated.status },
    });
    return updated;
  });
  revalidatePath("/studio/content");
  revalidatePath("/work");
  revalidatePath(`/work/${entry.slug}`);
  revalidatePath("/");
  redirect(`/studio/content?${publish ? "published" : "unpublished"}=${encodeURIComponent(entry.slug)}`);
}
