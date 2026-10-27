import { notFound, redirect } from "next/navigation";
import { ContentSubnav } from "@/components/studio/content-subnav";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content history | D-Team Production", robots: { index: false, follow: false } };

export default async function ContentHistoryPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { content: ["read"] }))) notFound();

  const revisions = await getPrisma().contentRevision.findMany({
    where: { organizationId: membership.organizationId },
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · WEBSITE</p>
      <h1 className="studio-page-title">Every change,<br /><em>on record.</em></h1>
      <p className="studio-page-intro">Content edits and publication changes are recorded here with the acting account and a timestamp. Accepted quotes and audit events keep their own history.</p>
      <ContentSubnav />

      <div className="cms-list-heading"><span>CONTENT REVISIONS</span><span>LATEST {revisions.length}</span></div>
      {revisions.length ? <div className="studio-table-wrap"><table className="studio-table">
        <thead><tr><th>When</th><th>Action</th><th>Resource</th><th>Resource ID</th><th>Actor</th></tr></thead>
        <tbody>{revisions.map((revision) => <tr key={revision.id}>
          <td>{formatDateTime(revision.createdAt)}</td>
          <td>{revision.action}</td>
          <td>{revision.resourceType}</td>
          <td><code>{revision.resourceId}</code></td>
          <td>{revision.actor?.name ?? revision.actor?.email ?? "System"}</td>
        </tr>)}</tbody>
      </table></div> : <div className="studio-empty-panel"><h2>No content changes recorded yet.</h2><p>Create or edit a portfolio entry, service, team profile, journal post, or social link to start the history.</p></div>}
    </>
  );
}
