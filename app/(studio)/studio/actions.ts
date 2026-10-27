"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { getStudioSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function createInitialWorkspace() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/sign-in");
  const platformUser = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!platformUser?.role?.split(",").includes("admin")) {
    throw new Error("Only the initial platform administrator can create the first workspace.");
  }

  const prisma = getPrisma();
  const existingMembership = await prisma.member.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existingMembership) redirect("/studio");
  if (await prisma.organization.count()) {
    throw new Error("The D-Team workspace already exists. Ask its owner to invite your account.");
  }

  const organization = await getAuth().api.createOrganization({
    body: {
      name: "D-Team Production",
      slug: "d-team-production",
      userId: session.user.id,
      keepCurrentActiveOrganization: false,
    },
  });

  if (!organization) throw new Error("The D-Team workspace could not be created.");

  await getAuth().api.setActiveOrganization({
    body: { organizationId: organization.id },
    headers: await headers(),
  });
  await prisma.auditEvent.create({
    data: {
      organizationId: organization.id,
      actorUserId: session.user.id,
      action: "created",
      resource: "organization",
      resourceId: organization.id,
    },
  });

  revalidatePath("/studio");
  redirect("/studio");
}
