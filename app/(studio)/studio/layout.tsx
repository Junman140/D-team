import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth/server";
import { getStudioWorkspaceAccess } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { SignOutButton } from "@/components/studio/sign-out-button";
import { StudioNavigation } from "@/components/studio/studio-navigation";
import { MotionControl } from "@/components/public/motion-control";
import { StudioActionFeedback } from "@/components/studio/studio-action-feedback";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const { session, membership, canInitializeWorkspace } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership && !canInitializeWorkspace) redirect("/studio/access-pending");

  const permissionKeys = ["inquiry", "content", "client", "project", "crew", "schedule", "quote", "deliverable", "media"] as const;
  const permissionResults = membership
    ? await Promise.all(permissionKeys.map(async (key) => getAuth().api.hasPermission({
        headers: await headers(),
        body: { organizationId: membership.organizationId, permissions: { [key]: ["read"] } },
      })))
    : permissionKeys.map(() => ({ success: false }));
  const [inquiryPermission, contentPermission, clientPermission, projectPermission, crewPermission, schedulePermission, quotePermission, deliverablePermission, mediaPermission] = permissionResults;
  const newInquiryCount = inquiryPermission.success && membership
    ? await getPrisma().inquiry.count({ where: { organizationId: membership.organizationId, status: "new" } })
    : 0;

  return (
    <div className="studio-shell">
      <a className="skip-link" href="#studio-main">Skip to workspace</a>
      <header className="studio-header">
        <Link className="studio-wordmark" href="/studio">D—TEAM <span>PRODUCTION</span></Link>
        <div className="studio-user-controls"><MotionControl context="workspace" /><span>{session.user.name}</span><SignOutButton /></div>
      </header>
      <div className="studio-body">
        <aside className="studio-sidebar">
          <StudioNavigation
            canReadInquiries={inquiryPermission.success}
            newInquiryCount={newInquiryCount}
            canReadContent={contentPermission.success}
            canReadClients={clientPermission.success}
            canReadProjects={projectPermission.success}
            canReadCrew={crewPermission.success}
            canReadSchedule={schedulePermission.success}
            canReadQuotes={quotePermission.success}
            canReadDeliverables={deliverablePermission.success}
            canReadMedia={mediaPermission.success}
          />
        </aside>
        <main className="studio-main" id="studio-main"><Suspense fallback={null}><StudioActionFeedback /></Suspense>{children}</main>
      </div>
    </div>
  );
}
