import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { createClient, updateClient } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients | D-Team Production", robots: { index: false, follow: false } };

export default async function ClientsPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { client: ["read"] }))) notFound();

  const [canCreate, canUpdate] = await Promise.all([
    hasStudioPermission(membership.organizationId, { client: ["create"] }),
    hasStudioPermission(membership.organizationId, { client: ["update"] }),
  ]);
  const clients = await getPrisma().client.findMany({
    where: { organizationId: membership.organizationId },
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · CLIENTS</p>
      <h1 className="studio-page-title">The people<br /><em>we make for.</em></h1>
      <p className="studio-page-intro">Keep client contact records in one place. Inquiries can be converted into a client and project without duplicating the contact.</p>

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW CLIENT</span>
        <h2>Add a client</h2>
        <form action={createClient} className="cms-form">
          <label>Name<input name="name" required minLength={2} maxLength={160} /></label>
          <label>Company<input name="company" maxLength={160} /></label>
          <label>Email<input name="email" type="email" maxLength={254} /></label>
          <label>Phone<input name="phone" maxLength={80} /></label>
          <label className="cms-wide">Notes<textarea name="notes" maxLength={5000} rows={4} /></label>
          <button type="submit">Save client</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>CLIENTS</span><span>{clients.length} TOTAL</span></div>
      {clients.length ? <div className="cms-entry-list">{clients.map((client) => (
        <article className="cms-entry" key={client.id}>
          <header><div><h2>{client.name}</h2><p>{client.company || "No company"} · {client.email || "No email"} · {client._count.projects} {client._count.projects === 1 ? "project" : "projects"}</p></div></header>
          {canUpdate && <details><summary>Edit client</summary>
            <form action={updateClient.bind(null, client.id)} className="cms-form">
              <label>Name<input name="name" required minLength={2} maxLength={160} defaultValue={client.name} /></label>
              <label>Company<input name="company" maxLength={160} defaultValue={client.company ?? ""} /></label>
              <label>Email<input name="email" type="email" maxLength={254} defaultValue={client.email ?? ""} /></label>
              <label>Phone<input name="phone" maxLength={80} defaultValue={client.phone ?? ""} /></label>
              <label className="cms-wide">Notes<textarea name="notes" maxLength={5000} rows={4} defaultValue={client.notes ?? ""} /></label>
              <button type="submit">Save client changes</button>
            </form>
          </details>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No clients yet.</h2><p>Add a client directly or convert an inquiry into a client and project.</p></div>}
    </>
  );
}
