"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formInt, formText, optionalText, optionalTextLimit, requireText } from "@/lib/forms";

const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined"] as const;

async function editor(permission: "create" | "update" | "approve") {
  const access = await requireStudioAction({ quote: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

async function nextNumber(organizationId: string) {
  const prisma = getPrisma();
  const year = new Date().getUTCFullYear();
  const count = await prisma.quote.count({ where: { organizationId } });
  let index = count + 1;
  while (await prisma.quote.findFirst({ where: { organizationId, number: `Q-${year}-${String(index).padStart(4, "0")}` }, select: { id: true } })) index += 1;
  return `Q-${year}-${String(index).padStart(4, "0")}`;
}

async function recalculate(tx: Prisma.TransactionClient, quoteId: string) {
  const [lines, quote] = await Promise.all([
    tx.quoteLineItem.findMany({ where: { quoteId }, select: { total: true } }),
    tx.quote.findUnique({ where: { id: quoteId }, select: { discountAmount: true } }),
  ]);
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const discountAmount = Math.min(quote?.discountAmount ?? 0, subtotal);
  await tx.quote.update({ where: { id: quoteId }, data: { subtotal, discountAmount, total: subtotal - discountAmount } });
}

export async function createQuote(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const projectId = optionalText(formData, "projectId");
  const clientId = optionalText(formData, "clientId");
  const currency = (formText(formData, "currency") || "NGN").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Use a three-letter currency code.");
  const prisma = getPrisma();
  if (projectId && !(await prisma.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } }))) throw new Error("Choose a project from this workspace.");
  if (clientId && !(await prisma.client.findFirst({ where: { id: clientId, organizationId }, select: { id: true } }))) throw new Error("Choose a client from this workspace.");
  const number = (formText(formData, "number") || await nextNumber(organizationId)).toUpperCase();
  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        organizationId,
        projectId,
        clientId,
        number,
        currency,
        notes: optionalTextLimit(optionalText(formData, "notes"), "Notes", 5000),
      },
    });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "quote", resourceId: created.id, metadata: { number } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "quote", resourceId: created.id, action: "created", snapshot: { number, projectId, clientId, currency } });
    return created;
  });
  revalidatePath("/studio/quotes");
  redirect(`/studio/quotes/${quote.id}?created=yes`);
}

export async function addQuoteLine(quoteId: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const description = requireText(formText(formData, "description"), "Line description", 2, 500);
  const quantity = formInt(formData, "quantity", 1);
  if (quantity < 1 || quantity > 10000) throw new Error("Quantity must be between 1 and 10,000.");
  const unit = Number(formText(formData, "unitAmount"));
  if (!Number.isFinite(unit) || unit < 0) throw new Error("Enter a valid unit amount.");
  const unitAmount = Math.round(unit * 100);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({ where: { id: quoteId, organizationId }, select: { id: true, status: true } });
    if (!quote) throw new Error("Quote not found.");
    if (quote.status === "accepted") throw new Error("Accepted quotes cannot be edited.");
    const line = await tx.quoteLineItem.create({ data: { quoteId, description, quantity, unitAmount, total: quantity * unitAmount } });
    await recalculate(tx, quoteId);
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "quote_line_item", resourceId: line.id, metadata: { quoteId } });
  });
  revalidatePath(`/studio/quotes/${quoteId}`);
  redirect(`/studio/quotes/${quoteId}?lineAdded=yes`);
}

export async function deleteQuoteLine(quoteId: string, lineId: string) {
  const { session, organizationId } = await editor("update");
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({ where: { id: quoteId, organizationId }, select: { id: true, status: true } });
    if (!quote) throw new Error("Quote not found.");
    if (quote.status === "accepted") throw new Error("Accepted quotes cannot be edited.");
    const line = await tx.quoteLineItem.findFirst({ where: { id: lineId, quoteId }, select: { id: true } });
    if (!line) throw new Error("Quote line item not found.");
    await tx.quoteLineItem.delete({ where: { id: lineId } });
    await recalculate(tx, quoteId);
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "deleted", resource: "quote_line_item", resourceId: lineId, metadata: { quoteId } });
  });
  revalidatePath(`/studio/quotes/${quoteId}`);
  redirect(`/studio/quotes/${quoteId}?lineRemoved=yes`);
}

export async function setQuoteDiscount(quoteId: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const amount = Number(formText(formData, "discountAmount"));
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid discount amount.");
  const discountAmount = Math.round(amount * 100);
  const discountLabel = optionalTextLimit(optionalText(formData, "discountLabel"), "Discount label", 160);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({ where: { id: quoteId, organizationId }, select: { id: true, status: true, subtotal: true } });
    if (!quote) throw new Error("Quote not found.");
    if (quote.status === "accepted") throw new Error("Accepted quotes cannot be edited.");
    if (discountAmount > quote.subtotal) throw new Error("The discount cannot exceed the subtotal.");
    await tx.quote.update({ where: { id: quoteId }, data: { discountAmount, discountLabel } });
    await recalculate(tx, quoteId);
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "quote_discount", resourceId: quoteId, metadata: { discountAmount, discountLabel } });
  });
  revalidatePath(`/studio/quotes/${quoteId}`);
  redirect(`/studio/quotes/${quoteId}?discount=yes`);
}

export async function setQuoteStatus(id: string, status: string) {
  if (!QUOTE_STATUSES.includes(status as (typeof QUOTE_STATUSES)[number])) throw new Error("Choose a valid quote status.");
  const permission = status === "accepted" ? "approve" : "update";
  const { session, organizationId } = await editor(permission);
  const prisma = getPrisma();
  const quote = await prisma.$transaction(async (tx) => {
    const existing = await tx.quote.findFirst({ where: { id, organizationId }, include: { lineItems: true } });
    if (!existing) throw new Error("Quote not found.");
    if (existing.status === "accepted" && status !== "accepted") throw new Error("Accepted quotes are locked.");
    if (status === "accepted" && existing.lineItems.length === 0) throw new Error("Add at least one line item before accepting a quote.");
    const snapshot = status === "accepted" ? {
      number: existing.number,
      currency: existing.currency,
      subtotal: existing.subtotal,
      discountAmount: existing.discountAmount,
      discountLabel: existing.discountLabel,
      total: existing.total,
      notes: existing.notes,
      lineItems: existing.lineItems.map((line) => ({ description: line.description, quantity: line.quantity, unitAmount: line.unitAmount, total: line.total })),
    } : undefined;
    const updated = await tx.quote.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === "accepted" ? new Date() : null,
        ...(status === "accepted" ? { acceptedSnapshot: snapshot as Prisma.InputJsonValue } : {}),
      },
    });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: status, resource: "quote", resourceId: updated.id, metadata: { number: updated.number } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "quote", resourceId: updated.id, action: status, snapshot: snapshot as Prisma.InputJsonValue | undefined });
    return updated;
  });
  revalidatePath("/studio/quotes");
  revalidatePath(`/studio/quotes/${id}`);
  redirect(`/studio/quotes/${quote.id}?status=${encodeURIComponent(status)}`);
}
