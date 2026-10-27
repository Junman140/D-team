import { notFound, redirect } from "next/navigation";
import { ContentSubnav } from "@/components/studio/content-subnav";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { createSocialLink, deleteSocialLink, setSocialLinkPublication, updateSocialLink } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Social content | D-Team Production", robots: { index: false, follow: false } };

export default async function ContentSocialPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { content: ["read"] }))) notFound();

  const [canCreate, canUpdate, canPublish] = await Promise.all([
    hasStudioPermission(membership.organizationId, { content: ["create"] }),
    hasStudioPermission(membership.organizationId, { content: ["update"] }),
    hasStudioPermission(membership.organizationId, { content: ["publish"] }),
  ]);
  const links = await getPrisma().socialLink.findMany({ where: { organizationId: membership.organizationId }, orderBy: [{ sortOrder: "asc" }, { platform: "asc" }] });

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · WEBSITE</p>
      <h1 className="studio-page-title">Follow the<br /><em>process.</em></h1>
      <p className="studio-page-intro">Only confirmed official channels appear on the public site. Links open the original platform in a new tab.</p>
      <ContentSubnav />

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW SOCIAL LINK</span>
        <h2>Add a channel</h2>
        <form action={createSocialLink} className="cms-form">
          <label>Platform<input name="platform" required minLength={2} maxLength={80} placeholder="Instagram" /></label>
          <label>Label <span>(optional)</span><input name="label" maxLength={120} placeholder="@dteam" /></label>
          <label className="cms-wide">HTTPS URL<input name="url" required maxLength={1000} placeholder="https://" /></label>
          <label>Sort order<input name="sortOrder" type="number" defaultValue={links.length} /></label>
          <button type="submit">Save link draft</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>SOCIAL LINKS</span><span>{links.length} TOTAL · {links.filter((link) => link.status === "published").length} PUBLISHED</span></div>
      {links.length ? <div className="cms-entry-list">{links.map((link) => (
        <article className="cms-entry" key={link.id}>
          <header><div><span className={`cms-status${link.status === "published" ? " is-published" : ""}`}>{link.status}</span><h2>{link.platform}</h2><p>{link.label ?? "No label"} · {link.url}</p></div>
            <a href={link.url} target="_blank" rel="noreferrer">Open channel ↗</a>
          </header>
          {canUpdate ? <details><summary>Edit link</summary>
            <form action={updateSocialLink.bind(null, link.id)} className="cms-form">
              <label>Platform<input name="platform" required minLength={2} maxLength={80} defaultValue={link.platform} /></label>
              <label>Label<input name="label" maxLength={120} defaultValue={link.label ?? ""} /></label>
              <label className="cms-wide">HTTPS URL<input name="url" required maxLength={1000} defaultValue={link.url} /></label>
              <label>Sort order<input name="sortOrder" type="number" defaultValue={link.sortOrder} /></label>
              <button type="submit">Save link changes</button>
            </form>
            <form action={deleteSocialLink.bind(null, link.id)} className="cms-publication-form"><button type="submit">Delete link</button></form>
          </details> : <p>Read-only access.</p>}
          {canPublish && <form action={setSocialLinkPublication.bind(null, link.id, link.status !== "published")} className="cms-publication-form">
            <button type="submit">{link.status === "published" ? "Unpublish" : "Publish"}</button>
          </form>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No social links yet.</h2><p>The public site keeps its pending state until official channels are confirmed.</p></div>}
    </>
  );
}
