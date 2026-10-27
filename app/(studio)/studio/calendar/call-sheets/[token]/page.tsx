import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Call sheet | D-Team Production", robots: { index: false, follow: false } };

export default async function CallSheetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { schedule: ["read"] }))) notFound();

  const sheet = await getPrisma().callSheet.findFirst({
    where: { shareToken: token, organizationId: membership.organizationId },
    include: {
      project: {
        include: {
          client: { select: { name: true } },
          members: { include: { crewProfile: true, user: { select: { name: true, email: true } } } },
        },
      },
      scheduleItem: true,
    },
  });
  if (!sheet) notFound();
  const details = (sheet.details ?? {}) as { location?: string; notes?: string };

  return (
    <main className="call-sheet-page">
      <Link className="text-link" href="/studio/calendar">← Calendar</Link>
      <p className="eyebrow">D—TEAM PRODUCTION · CALL SHEET · PRIVATE</p>
      <h1>{sheet.title}</h1>
      <p className="studio-page-intro">This private link only opens for an authorized staff session. Do not forward it outside the workspace.</p>
      <dl className="call-sheet-meta">
        <div><dt>Project</dt><dd><Link href={`/studio/projects/${sheet.project.id}`}>{sheet.project.name}</Link></dd></div>
        <div><dt>Client</dt><dd>{sheet.project.client?.name || "Not set"}</dd></div>
        <div><dt>Call</dt><dd>{sheet.scheduleItem ? `${formatDateTime(sheet.scheduleItem.startsAt)} – ${formatDateTime(sheet.scheduleItem.endsAt)}` : "Not scheduled"}</dd></div>
        <div><dt>Location</dt><dd>{details.location || sheet.scheduleItem?.location || "Not set"}</dd></div>
        <div><dt>Status</dt><dd>{sheet.status}</dd></div>
      </dl>
      {details.notes && <section className="call-sheet-notes"><h2>Notes</h2><p>{details.notes}</p></section>}
      <section className="call-sheet-notes"><h2>Crew</h2>
        {sheet.project.members.length ? <ul className="studio-mini-list">{sheet.project.members.map((member) => <li key={member.id}><strong>{member.crewProfile?.name || member.user?.name || "Unknown"}</strong><span>{member.role}{member.crewProfile?.phone ? ` · ${member.crewProfile.phone}` : ""}{member.crewProfile?.email ? ` · ${member.crewProfile.email}` : ""}</span></li>)}</ul> : <p>No crew assigned.</p>}
      </section>
    </main>
  );
}
