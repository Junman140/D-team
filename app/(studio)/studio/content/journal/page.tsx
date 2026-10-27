import { notFound, redirect } from "next/navigation";
import { ContentSubnav } from "@/components/studio/content-subnav";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/format";
import { createJournalPost, setJournalPostPublication, updateJournalPost } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Journal content | D-Team Production", robots: { index: false, follow: false } };

export default async function ContentJournalPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { content: ["read"] }))) notFound();

  const [canCreate, canUpdate, canPublish] = await Promise.all([
    hasStudioPermission(membership.organizationId, { content: ["create"] }),
    hasStudioPermission(membership.organizationId, { content: ["update"] }),
    hasStudioPermission(membership.organizationId, { content: ["publish"] }),
  ]);
  const posts = await getPrisma().journalPost.findMany({ where: { organizationId: membership.organizationId }, orderBy: { updatedAt: "desc" } });

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · WEBSITE</p>
      <h1 className="studio-page-title">Notes from<br /><em>the process.</em></h1>
      <p className="studio-page-intro">Journal entries are private drafts until published. Saving an edit to a published entry returns it to draft until it is approved again.</p>
      <ContentSubnav />

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW JOURNAL ENTRY</span>
        <h2>Write a draft</h2>
        <form action={createJournalPost} className="cms-form">
          <label>Title<input name="title" required minLength={2} maxLength={160} /></label>
          <label>URL slug <span>(optional)</span><input name="slug" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <label>Author<input name="authorName" maxLength={120} /></label>
          <label>Cover image path or HTTPS URL<input name="coverImageUrl" maxLength={1000} /></label>
          <label className="cms-wide">Excerpt<textarea name="excerpt" required minLength={10} maxLength={500} rows={2} /></label>
          <label className="cms-wide">Body<textarea name="body" required minLength={20} maxLength={30000} rows={10} /></label>
          <button type="submit">Save journal draft</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>JOURNAL ENTRIES</span><span>{posts.length} TOTAL · {posts.filter((post) => post.status === "published").length} PUBLISHED</span></div>
      {posts.length ? <div className="cms-entry-list">{posts.map((post) => (
        <article className="cms-entry" key={post.id}>
          <header><div><span className={`cms-status${post.status === "published" ? " is-published" : ""}`}>{post.status}</span><h2>{post.title}</h2><p>/{post.slug} · {post.publishedAt ? `Published ${formatDate(post.publishedAt)}` : `Updated ${formatDate(post.updatedAt)}`}</p></div>
            <a href={`/journal/${post.slug}`} target="_blank" rel="noreferrer">{post.status === "published" ? "View public page" : "Preview draft"} ↗</a>
          </header>
          {canUpdate ? <details><summary>Edit entry</summary>
            <form action={updateJournalPost.bind(null, post.id)} className="cms-form">
              <label>Title<input name="title" required minLength={2} maxLength={160} defaultValue={post.title} /></label>
              <label>URL slug<input name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={post.slug} /></label>
              <label>Author<input name="authorName" maxLength={120} defaultValue={post.authorName ?? ""} /></label>
              <label>Cover image path or HTTPS URL<input name="coverImageUrl" maxLength={1000} defaultValue={post.coverImageUrl ?? ""} /></label>
              <label className="cms-wide">Excerpt<textarea name="excerpt" required minLength={10} maxLength={500} rows={2} defaultValue={post.excerpt} /></label>
              <label className="cms-wide">Body<textarea name="body" required minLength={20} maxLength={30000} rows={12} defaultValue={post.body} /></label>
              <button type="submit">Save entry changes</button>
            </form>
          </details> : <p>Read-only access.</p>}
          {canPublish && <form action={setJournalPostPublication.bind(null, post.id, post.status !== "published")} className="cms-publication-form">
            <button type="submit">{post.status === "published" ? "Unpublish" : "Publish"}</button>
          </form>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No journal entries yet.</h2><p>Write a draft when there is an approved story to share.</p></div>}
    </>
  );
}
