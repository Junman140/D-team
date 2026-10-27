"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formText, optionalText, optionalTextLimit, requireText } from "@/lib/forms";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clientFields(formData: FormData) {
  const name = requireText(formText(formData, "name"), "Client name", 2, 160);
  const company = optionalTextLimit(optionalText(formData, "company"), "Company", 160);
  const email = optionalTextLimit(optionalText(formData, "email"), "Email", 254)?.toLowerCase() ?? null;
  if (email && !EMAIL_PATTERN.test(email)) throw new Error("Enter a valid client email.");
  return {
    name,
    company,
    email,
    phone: optionalTextLimit(optionalText(formData, "phone"), "Phone", 80),
    notes: optionalTextLimit(optionalText(formData, "notes"), "Notes", 5000),
  };
}

async function editor(permission: "create" | "update") {
  const access = await requireStudioAction({ client: [permission] });
  return { session: access.session, organizationId: access.organizationId };
}

export async function createClient(formData: FormData) {
  const { session, organizationId } = await editor("create");
  const data = clientFields(formData);
  const prisma = getPrisma();
  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({ data: { ...data, organizationId } });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "created", resource: "client", resourceId: created.id, metadata: { name: created.name } });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "client", resourceId: created.id, action: "created", snapshot: data });
    return created;
  });
  revalidatePath("/studio/clients");
  revalidatePath("/studio/projects");
  redirect(`/studio/clients?created=${encodeURIComponent(client.id)}`);
}

export async function updateClient(id: string, formData: FormData) {
  const { session, organizationId } = await editor("update");
  const data = clientFields(formData);
  const prisma = getPrisma();
  const client = await prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({ where: { id, organizationId }, data });
    await writeAudit(tx, { organizationId, actorUserId: session.user.id, action: "updated", resource: "client", resourceId: updated.id });
    await writeRevision(tx, { organizationId, actorUserId: session.user.id, resourceType: "client", resourceId: updated.id, action: "updated", snapshot: data });
    return updated;
  });
  revalidatePath("/studio/clients");
  redirect(`/studio/clients?updated=${encodeURIComponent(client.id)}`);
}
