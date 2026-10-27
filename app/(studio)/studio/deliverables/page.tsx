import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/format";
import { CopyLinkButton } from "@/components/studio/copy-link-button";
import { createDeliverable, createDeliverableLink, revokeDeliverableLink, setDeliverableStatus, updateDeliverable } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deliverables | D-Team Production", robots: { index: false, follow: false } };

export default async function DeliverablesPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { deliverable: ["read"] }))) notFound();

  const [canCreate, canUpdate, canDeliver] = await Promise.all([
    hasStudioPermission(membership.organizationId, { deliverable: ["create"] }),
    hasStudioPermission(membership.organizationId, { deliverable: ["update"] }),
    hasStudioPermission(membership.organizationId, { deliverable: ["deliver"] }),
  ]);
  const prisma = getPrisma();
  const [deliverables, projects] = await Promise.all([
    prisma.deliverable.findMany({ where: { organizationId: membership.organizationId }, include: { project: { select: { id: true, name: true } } }, orderBy: [{ status: "asc" }, { dueAt: "asc" }] }),
    prisma.project.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · DELIVERABLES</p>
      <h1 className="studio-page-title">Promised work,<br /><em>tracked.</em></h1>
      <p className="studio-page-intro">Every deliverable belongs to a project. Review links are HTTPS only; marking a deliverable delivered records the timestamp.</p>

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW DELIVERABLE</span>
        <h2>Add a deliverable</h2>
        <form action={createDeliverable} className="cms-form">
          <label>Project<select name="projectId" required defaultValue=""><option value="" disabled>Choose project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>Title<input name="title" required minLength={2} maxLength={160} /></label>
          <label>Status<select name="status" defaultValue="planned"><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="review">In review</option><option value="delivered">Delivered</option></select></label>
          <label>Due date<input name="dueAt" type="date" /></label>
          <label className="cms-wide">Review URL <span>(HTTPS only)</span><input name="reviewUrl" maxLength={1000} placeholder="https://" /></label>
          <label className="cms-wide">Description<textarea name="description" maxLength={5000} rows={3} /></label>
          <button type="submit">Save deliverable</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>DELIVERABLES</span><span>{deliverables.length} TOTAL · {deliverables.filter((entry) => entry.status === "delivered").length} DELIVERED</span></div>
      {deliverables.length ? <div className="cms-entry-list">{deliverables.map((entry) => (
        <article className="cms-entry" key={entry.id}>
          <header><div><span className={`cms-status${entry.status === "delivered" ? " is-published" : ""}`}>{entry.status}</span><h2>{entry.title}</h2><p><Link href={`/studio/projects/${entry.project.id}`}>{entry.project.name}</Link> · Due {formatDate(entry.dueAt)}{entry.deliveredAt ? ` · Delivered ${formatDate(entry.deliveredAt)}` : ""}</p></div>{entry.reviewUrl && <a href={entry.reviewUrl} target="_blank" rel="noreferrer">Open review ↗</a>}</header>
          {entry.description && <p className="cms-entry-meta">{entry.description}</p>}
          {canDeliver && <details className="delivery-panel"><summary>External delivery link</summary>
            {entry.deliveryToken && !entry.deliveryRevokedAt && (!entry.deliveryExpiresAt || entry.deliveryExpiresAt > new Date()) ? (
              <div className="delivery-link-active">
                <p><strong>Active link</strong> · Expires {formatDate(entry.deliveryExpiresAt)}</p>
                <code>/delivery/{entry.deliveryToken}</code>
                <div className="delivery-link-actions"><CopyLinkButton path={`/delivery/${entry.deliveryToken}`} /><form action={revokeDeliverableLink.bind(null, entry.id)}><button type="submit">Revoke link</button></form></div>
              </div>
            ) : (
              <div className="delivery-link-inactive">
                <p>{entry.deliveryToken ? (entry.deliveryRevokedAt ? "The previous delivery link was revoked." : "The previous delivery link has expired.") : "No external delivery link has been created."}</p>
                <form action={createDeliverableLink.bind(null, entry.id)} className="delivery-link-form">
                  <label>Link expiry<select name="expiresInDays" defaultValue="14"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label>
                  <button type="submit">Create delivery link</button>
                </form>
              </div>
            )}
          </details>}
          {canUpdate && <details><summary>Edit deliverable</summary>
            <form action={updateDeliverable.bind(null, entry.id)} className="cms-form">
              <label>Project<select name="projectId" required defaultValue={entry.projectId}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label>Title<input name="title" required minLength={2} maxLength={160} defaultValue={entry.title} /></label>
              <label>Status<select name="status" defaultValue={entry.status}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="review">In review</option><option value="delivered">Delivered</option></select></label>
              <label>Due date<input name="dueAt" type="date" defaultValue={entry.dueAt ? entry.dueAt.toISOString().slice(0, 10) : ""} /></label>
              <label className="cms-wide">Review URL<input name="reviewUrl" maxLength={1000} defaultValue={entry.reviewUrl ?? ""} /></label>
              <label className="cms-wide">Description<textarea name="description" maxLength={5000} rows={3} defaultValue={entry.description ?? ""} /></label>
              <button type="submit">Save deliverable changes</button>
            </form>
          </details>}
          <div className="inquiry-actions">
            {canUpdate && entry.status !== "review" && <form action={setDeliverableStatus.bind(null, entry.id, "review")}><button type="submit">Send to review</button></form>}
            {canDeliver && entry.status !== "delivered" && <form action={setDeliverableStatus.bind(null, entry.id, "delivered")}><button type="submit" className="primary-action">Mark delivered</button></form>}
          </div>
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No deliverables yet.</h2><p>Add the promised outputs once a project is underway.</p></div>}
    </>
  );
}
