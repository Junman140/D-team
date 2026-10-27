import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJournalPost } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug, { includeDrafts: process.env.NODE_ENV === "development" || await canPreviewContent() });
  return post ? { title: `${post.title} | D-Team Studio`, description: post.excerpt } : { title: "Journal entry not found | D-Team Studio" };
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getJournalPost(slug, { includeDrafts: process.env.NODE_ENV === "development" || await canPreviewContent() });
  if (!post) notFound();

  return (
    <main className="journal-detail section-wrap" id="main-content">
      <Link className="text-link" href="/journal">← All journal entries</Link>
      <p className="eyebrow">D—TEAM STUDIO · JOURNAL {post.publishedAt ? `· ${formatDate(post.publishedAt)}` : "· DRAFT"}</p>
      {post.status === "draft" && <span className="draft-tag">DRAFT · PREVIEW ONLY FOR AUTHORIZED STAFF</span>}
      <h1>{post.title}</h1>
      <p className="journal-detail-excerpt">{post.excerpt}</p>
      {post.coverImageUrl && <img className="journal-detail-cover" src={post.coverImageUrl} alt="" />}
      <div className="journal-body">{post.body}</div>
      {post.authorName && <p className="asset-note">Words by {post.authorName}</p>}
    </main>
  );
}
