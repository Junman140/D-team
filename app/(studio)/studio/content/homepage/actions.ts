"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit, writeRevision } from "@/lib/audit";
import { formText, optionalText, optionalTextLimit, requireText } from "@/lib/forms";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function editor() {
  const access = await requireStudioAction({ content: ["update"] });
  return { session: access.session, organizationId: access.organizationId };
}

async function upsertSetting(organizationId: string, key: string, value: Prisma.InputJsonValue, actorUserId: string, action: string) {
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.siteSetting.upsert({
      where: { organizationId_key: { organizationId, key } },
      create: { organizationId, key, value },
      update: { value },
    });
    await writeAudit(tx, { organizationId, actorUserId, action, resource: "site_setting", resourceId: key });
    await writeRevision(tx, { organizationId, actorUserId, resourceType: "site_setting", resourceId: key, action, snapshot: value });
  });
}

export async function saveHomepageSettings(formData: FormData) {
  const { session, organizationId } = await editor();
  const contactEmail = optionalTextLimit(optionalText(formData, "contactEmail"), "Contact email", 254);
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) throw new Error("Enter a valid contact email.");
  const value = {
    contactEmail,
    contactPhone: optionalTextLimit(optionalText(formData, "contactPhone"), "Contact phone", 80),
    contactAddress: optionalTextLimit(optionalText(formData, "contactAddress"), "Contact address", 300),
    availability: optionalTextLimit(optionalText(formData, "availability"), "Availability", 160),
    intro: optionalTextLimit(optionalText(formData, "intro"), "Intro", 600),
  };
  await upsertSetting(organizationId, "homepage", value, session.user.id, "updated");
  revalidatePath("/studio/content/homepage");
  revalidatePath("/");
  revalidatePath("/request-quote");
  redirect("/studio/content/homepage?saved=homepage");
}

export async function savePolicy(key: "privacy" | "terms", formData: FormData) {
  const { session, organizationId } = await editor();
  const body = requireText(formText(formData, "body"), "Policy body", 20, 30000);
  const contactEmail = optionalTextLimit(optionalText(formData, "contactEmail"), "Contact email", 254);
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) throw new Error("Enter a valid contact email.");
  const value = {
    approved: formText(formData, "approved") === "yes",
    body,
    contactEmail,
    retention: optionalTextLimit(optionalText(formData, "retention"), "Retention wording", 2000),
    updatedAt: new Date().toISOString(),
  };
  await upsertSetting(organizationId, key, value, session.user.id, "updated");
  revalidatePath("/studio/content/homepage");
  revalidatePath(`/${key}`);
  redirect(`/studio/content/homepage?saved=${key}`);
}
