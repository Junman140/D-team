import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServiceOffering } from "@/features/services/services";
import { getAuth } from "@/lib/auth/server";
import { AuthorizationDeniedError, getStudioWorkspaceAccess, requireStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { convertInquiryToClientProject, updateInquiryStatus } from "./actions";

export const metadata = { title: "Inquiries | D-Team Production", robots: { index: false, follow: false } };

export default async function StudioInquiriesPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");

  try {
    await requireStudioPermission(membership.organizationId, { inquiry: ["read"] });
  } catch (error) {
    if (error instanceof AuthorizationDeniedError) notFound();
    throw error;
  }

  const canUpdate = (await getAuth().api.hasPermission({
    headers: await headers(),
    body: { organizationId: membership.organizationId, permissions: { inquiry: ["update"] } },
  })).success;
  const inquiries = await getPrisma().inquiry.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      serviceSlug: true,
      eventDate: true,
      location: true,
      details: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · INQUIRIES</p>
      <h1 className="studio-page-title">Start with<br /><em>the brief.</em></h1>
      <p className="studio-page-intro">New project requests appear here for authorized staff to review. Keep client details within the workspace.</p>
      <div className="inquiry-list-heading"><span>{inquiries.length} {inquiries.length === 1 ? "INQUIRY" : "INQUIRIES"}</span><span>NEW REQUESTS FIRST</span></div>
      {inquiries.length === 0 ? (
        <div className="studio-empty-panel"><span className="studio-empty-index">INBOX / CLEAR</span><h2>No project inquiries yet.</h2><p>New submissions from the public quote form will appear here.</p></div>
      ) : (
        <div className="studio-inquiry-list">
          {inquiries.map((inquiry) => {
            const service = getServiceOffering(inquiry.serviceSlug);
            return (
              <article className="studio-inquiry-card" key={inquiry.id}>
                <div className="studio-inquiry-card-header">
                  <div><p className="eyebrow">{service?.discipline ?? "PROJECT"} · {service?.name ?? inquiry.serviceSlug}</p><h2>{inquiry.name}</h2></div>
                  <span className={`inquiry-status inquiry-status-${inquiry.status}`}>{inquiry.status}</span>
                </div>
                <a className="studio-inquiry-email" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                <p className="studio-inquiry-meta">
                  {inquiry.eventDate ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(inquiry.eventDate) : "Date not supplied"}
                  {inquiry.location ? ` · ${inquiry.location}` : ""}
                  {` · Received ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(inquiry.createdAt)}`}
                </p>
                <details className="studio-inquiry-details"><summary>Read project brief</summary><p>{inquiry.details}</p></details>
                {canUpdate && inquiry.status !== "converted" && <div className="inquiry-actions">
                  {inquiry.status !== "reviewed" && <form action={updateInquiryStatus.bind(null, inquiry.id, "reviewed")}><button type="submit">Mark reviewed</button></form>}
                  <form action={updateInquiryStatus.bind(null, inquiry.id, "archived")}><button type="submit">Archive</button></form>
                  <form action={convertInquiryToClientProject.bind(null, inquiry.id)}><button type="submit" className="primary-action">Convert to client + project</button></form>
                </div>}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
