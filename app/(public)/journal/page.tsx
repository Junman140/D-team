import type { Metadata } from "next";
import Link from "next/link";
import { listJournalPosts } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Journal | D-Team Studio", description: "Notes, process, and stories from D-Team production." };

export default async function JournalPage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const posts = await listJournalPosts({ includeDrafts: preview });

  return (
    <main className="journal-page section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · JOURNAL</p>
      <h1 data-reveal="mask">Notes from<br /><em>the process.</em></h1>
      <p className="team-page-intro">Ideas, decisions, and lessons from the work behind the work.</p>
      {preview && <span className="draft-tag">DRAFT PREVIEW · PUBLISHED ENTRIES ONLY IN PRODUCTION</span>}
      {posts.length > 0 ? <div className="journal-grid">{posts.map((post) => (
        <article className="journal-card" data-reveal key={post.id}>
          {post.coverImageUrl && <img src={post.coverImageUrl} alt="" loading="lazy" />}
          <p className="eyebrow">{post.publishedAt ? formatDate(post.publishedAt) : "DRAFT"} {post.authorName ? `· ${post.authorName}` : ""}</p>
          <h2><Link href={`/journal/${post.slug}`}>{post.title}<span aria-hidden="true">↗</span></Link></h2>
          <p>{post.excerpt}</p>
        </article>
      ))}</div> : <div className="journal-empty"><span className="pulse-dot" aria-hidden="true" /><h2>No journal entries yet.</h2><p>Approved stories will appear here once they are published. In the meantime, the work and the contact line are open.</p><Link className="text-link" href="/work">See the work <span aria-hidden="true">↗</span></Link></div>}
    </main>
  );
}
