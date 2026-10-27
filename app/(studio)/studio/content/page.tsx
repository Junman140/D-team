import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth/server";
import { getStudioWorkspaceAccess } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { portfolioCategories } from "@/features/portfolio/projects";
import { ContentSubnav } from "@/components/studio/content-subnav";
import { createPortfolioEntry, setPortfolioEntryPublication, updatePortfolioEntry } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website content | D-Team Production", robots: { index: false, follow: false } };

function CategoryChecks({ selected = [] }: { selected?: string[] }) {
  return <fieldset className="cms-categories"><legend>Categories</legend>{portfolioCategories.map((category) => (
    <label key={category}><input type="checkbox" name="categories" value={category} defaultChecked={selected.includes(category)} /> {category}</label>
  ))}</fieldset>;
}

export default async function StudioContentPage() {
  const { membership } = await getStudioWorkspaceAccess();
  if (!membership) notFound();
  const permission = await getAuth().api.hasPermission({
    headers: await headers(),
    body: { organizationId: membership.organizationId, permissions: { content: ["read"] } },
  });
  if (!permission.success) notFound();

  const entries = await getPrisma().portfolioEntry.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      credits: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
  const canCreate = (await getAuth().api.hasPermission({
    headers: await headers(),
    body: { organizationId: membership.organizationId, permissions: { content: ["create"] } },
  })).success;
  const canUpdate = (await getAuth().api.hasPermission({
    headers: await headers(),
    body: { organizationId: membership.organizationId, permissions: { content: ["update"] } },
  })).success;
  const canPublish = (await getAuth().api.hasPermission({
    headers: await headers(),
    body: { organizationId: membership.organizationId, permissions: { content: ["publish"] } },
  })).success;

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · WEBSITE</p>
      <h1 className="studio-page-title">Work, ready<br /><em>for the world.</em></h1>
      <p className="studio-page-intro">Manage portfolio drafts and publication. Only published entries appear on the public site. Confirm content and usage approval every time you publish. Saving edits to a published entry returns it to draft until it is approved and published again.</p>
      <ContentSubnav />

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW PORTFOLIO ENTRY</span>
        <h2>Create a draft</h2>
        <form action={createPortfolioEntry} className="cms-form">
          <label>Title<input name="title" required minLength={2} maxLength={120} /></label>
          <label>URL slug <span>(optional; generated from title)</span><input name="slug" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <label className="cms-wide">Summary<textarea name="summary" required minLength={10} maxLength={900} rows={3} /></label>
          <CategoryChecks />
          <label>Production year<input name="productionYear" type="number" min={1900} max={2100} /></label>
          <label>Client or credit line<input name="clientCredit" maxLength={240} /></label>
          <label>Cover image path or HTTPS URL<input name="coverImageUrl" maxLength={1000} /></label>
          <label>Brief<textarea name="brief" maxLength={5000} rows={4} /></label>
          <label>Production approach<textarea name="approach" maxLength={5000} rows={4} /></label>
          <label>Result<textarea name="outcome" maxLength={5000} rows={4} /></label>
          <label className="cms-wide">Media sequence <span>One per line: URL | alt text | caption | image or video</span><textarea name="media" rows={4} placeholder="/work/still-01.jpg | Crew on location | Behind the scenes | image" /></label>
          <label className="cms-wide">Credits <span>One per line: role | name</span><textarea name="credits" rows={3} placeholder="Director | Name&#10;Producer | Name" /></label>
          <button type="submit">Save draft</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>PORTFOLIO ENTRIES</span><span>{entries.length} TOTAL · {entries.filter((entry) => entry.status === "published").length} PUBLISHED</span></div>
      {entries.length ? <div className="cms-entry-list">{entries.map((entry) => (
        <article className="cms-entry" key={entry.id}>
          <header><div><span className={`cms-status${entry.status === "published" ? " is-published" : ""}`}>{entry.status}</span><h2>{entry.title}</h2><p>/{entry.slug} · Updated {entry.updatedAt.toLocaleDateString()}</p></div>
            <a href={`/work/${entry.slug}`} target="_blank" rel="noreferrer">{entry.status === "published" ? "View public page" : "Preview draft"} ↗</a>
          </header>
          <p className="cms-entry-meta">{entry.media.length} media · {entry.credits.length} credits · {entry.categories.join(" · ")}</p>
          {canUpdate ? <details><summary>Edit entry</summary>
            <form action={updatePortfolioEntry.bind(null, entry.id)} className="cms-form">
              <label>Title<input name="title" required minLength={2} maxLength={120} defaultValue={entry.title} /></label>
              <label>URL slug<input name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={entry.slug} /></label>
              <label className="cms-wide">Summary<textarea name="summary" required minLength={10} maxLength={900} rows={3} defaultValue={entry.summary} /></label>
              <CategoryChecks selected={entry.categories} />
              <label>Production year<input name="productionYear" type="number" min={1900} max={2100} defaultValue={entry.productionYear ?? ""} /></label>
              <label>Client or credit line<input name="clientCredit" maxLength={240} defaultValue={entry.clientCredit ?? ""} /></label>
              <label>Cover image path or HTTPS URL<input name="coverImageUrl" maxLength={1000} defaultValue={entry.coverImageUrl ?? ""} /></label>
              <label>Brief<textarea name="brief" maxLength={5000} rows={4} defaultValue={entry.brief ?? ""} /></label>
              <label>Production approach<textarea name="approach" maxLength={5000} rows={4} defaultValue={entry.approach ?? ""} /></label>
              <label>Result<textarea name="outcome" maxLength={5000} rows={4} defaultValue={entry.outcome ?? ""} /></label>
              <label className="cms-wide">Media sequence <span>One per line: URL | alt text | caption | image or video</span><textarea name="media" rows={4} defaultValue={entry.media.map((item) => [item.url, item.alt, item.caption ?? "", item.mediaType].join(" | ")).join("\n")} /></label>
              <label className="cms-wide">Credits <span>One per line: role | name</span><textarea name="credits" rows={3} defaultValue={entry.credits.map((item) => `${item.role} | ${item.name}`).join("\n")} /></label>
              <button type="submit">Save changes</button>
            </form>
          </details> : <p>You can read website content but do not have edit access.</p>}
          {canPublish && <form action={setPortfolioEntryPublication.bind(null, entry.id, entry.status !== "published")} className="cms-publication-form">
            {entry.status !== "published" && <label><input name="publicationConfirmed" type="checkbox" value="yes" required /> I confirm this project content and its media are approved for public use.</label>}
            <button type="submit">{entry.status === "published" ? "Unpublish" : "Publish"}</button>
          </form>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No portfolio entries yet.</h2><p>Start with a draft. Drafts remain private to the Studio and development preview until an authorized editor publishes them.</p></div>}
    </>
  );
}
