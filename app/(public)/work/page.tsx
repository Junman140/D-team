import type { Metadata } from "next";
import { PortfolioBrowser } from "@/components/public/portfolio-browser";
import { listPortfolioEntries } from "@/features/portfolio/queries";
import { canPreviewContent } from "@/features/content/preview";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const projects = await listPortfolioEntries();
  return {
    title: "Work | D-Team Studio",
    description: "Selected D-Team production work and case studies.",
    robots: projects.length > 0 ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function WorkPage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const projects = await listPortfolioEntries({ includeDrafts: preview });

  return (
    <main className="work-index section-wrap" id="main-content">
      <div className="work-index-heading">
        <p className="eyebrow">D—TEAM STUDIO · WORK</p>
        <h1 data-reveal="mask">Made with<br /><em>the whole crew.</em></h1>
        <p>{projects.length > 0 ? "Explore projects by discipline." : "Published project stories are being prepared."}</p>
        {preview && <span className="draft-tag">DRAFT PREVIEW · PUBLISHED ENTRIES ONLY IN PRODUCTION</span>}
      </div>
      {projects.length > 0 ? <PortfolioBrowser projects={projects} /> : <p className="portfolio-empty-state">No published projects are available yet.</p>}
    </main>
  );
}
