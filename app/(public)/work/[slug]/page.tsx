import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortfolioEntry, listRelatedPortfolioEntries } from "@/features/portfolio/queries";
import { canPreviewContent } from "@/features/content/preview";
import { Corners } from "@/components/public/corners";
import { StoryOverlay } from "@/components/public/story-overlay";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPortfolioEntry(slug, { includeDrafts: process.env.NODE_ENV === "development" || await canPreviewContent() });
  if (!project) return { title: "Work not found | D-Team Studio", robots: { index: false, follow: false } };
  return {
    title: `${project.title} | D-Team Studio`,
    description: project.summary,
    robots: project.status === "published" ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function WorkPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPortfolioEntry(slug, { includeDrafts: process.env.NODE_ENV === "development" || await canPreviewContent() });
  if (!project) notFound();

  const sections = [
    ["01", "The brief", project.brief],
    ["02", "Production", project.approach],
    ["03", "The result", project.outcome],
  ].filter((section): section is [string, string, string] => Boolean(section[2]));
  const related = await listRelatedPortfolioEntries(slug);
  const storySynopsis = [project.brief, project.approach, project.outcome].filter(Boolean).join("\n\n")
    || "The full production story for this entry is being prepared. The logline above is the approved public summary for now.";

  return (
    <main className="case-study-preview section-wrap" id="main-content">
      <Link className="text-link" href="/work">← Back to work</Link>
      <p className="eyebrow">D—TEAM STUDIO · {project.status === "published" ? "CASE STUDY" : "CASE STUDY PREVIEW"}</p>
      {project.status === "draft" && <span className="draft-tag">DRAFT · PREVIEW ONLY FOR AUTHORIZED STAFF</span>}
      <h1 data-reveal="mask">{project.title}{project.productionYear ? <><br /><em>{project.productionYear}</em></> : null}</h1>
      <p className="case-study-summary">{project.summary}</p>
      <div className="case-study-hero-actions">
        <StoryOverlay
          story={{
            title: project.title,
            logline: project.summary || "The public logline for this entry is being prepared.",
            synopsis: storySynopsis,
            categories: project.categories,
            year: project.productionYear,
            status: project.status,
          }}
        />
        <span className="case-study-hero-note">LOGLINE · SYNOPSIS · PRODUCTION</span>
      </div>
      <div className="case-study-meta"><span>CATEGORIES</span><strong>{project.categories.join(" · ")}</strong><span>CLIENT / CREDITS</span><strong>{project.clientCredit || "Not provided"}</strong></div>
      {project.coverImageUrl ? (
        <div className="case-study-cover-stack" data-reveal>
          <Corners className="case-study-cover-corners" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="case-study-cover" src={project.coverImageUrl} alt={`Cover image for ${project.title}`} />
        </div>
      ) : (
        <div className="case-study-placeholder" role="img" aria-label="Approved project media not provided">
          <span>APPROVED PROJECT MEDIA PENDING</span>
        </div>
      )}
      <div className="case-study-sections" data-reveal>
        {sections.map(([number, heading, copy]) => (
          <section key={number}><span>{number}</span><h2>{heading}</h2><p>{copy}</p></section>
        ))}
      </div>
      {project.media && project.media.length > 0 && (
        <section className="case-study-media" aria-labelledby="case-study-media-title">
          <p className="eyebrow">SELECTED FRAMES</p>
          <h2 id="case-study-media-title">The work,<br /><em>in sequence.</em></h2>
          <div className="case-study-media-grid">
            {project.media.map((item) => (
              <figure key={item.id ?? item.url}>
                {item.mediaType === "video" ? (
                  <video controls preload="metadata" aria-label={item.alt}>
                    <source src={item.url} />
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.alt} loading="lazy" />
                )}
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}
      {project.credits && project.credits.length > 0 && (
        <section className="case-study-credits" aria-labelledby="case-study-credits-title">
          <p className="eyebrow">CREDITS</p>
          <h2 id="case-study-credits-title">The people<br /><em>who made it.</em></h2>
          <dl>{project.credits.map((credit) => <div key={credit.id ?? `${credit.role}-${credit.name}`}><dt>{credit.role}</dt><dd>{credit.name}</dd></div>)}</dl>
        </section>
      )}
      {related.length > 0 && (
        <section className="related-work" aria-labelledby="related-work-title">
          <p className="eyebrow">MORE WORK</p>
          <h2 id="related-work-title">Keep<br /><em>looking.</em></h2>
          <div className="related-work-grid">
            {related.map((entry) => (
              <Link href={`/work/${entry.slug}`} key={entry.slug}><span>{entry.categories.join(" · ")}</span><strong>{entry.title}</strong><i aria-hidden="true">↗</i></Link>
            ))}
          </div>
        </section>
      )}
      {project.status === "draft" && <p className="asset-note">Draft preview. Search engines are asked not to index this entry.</p>}
    </main>
  );
}
