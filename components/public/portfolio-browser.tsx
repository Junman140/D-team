"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { StoryOverlay } from "@/components/public/story-overlay";
import { portfolioCategories, type PortfolioCategory, type PortfolioProject } from "@/features/portfolio/projects";

const filters = ["All work", ...portfolioCategories] as const;
type Filter = (typeof filters)[number];

function storyFor(project: PortfolioProject) {
  const synopsis = [project.brief, project.approach, project.outcome].filter(Boolean).join("\n\n");
  return {
    title: project.title,
    logline: project.summary || "The public logline for this entry is being prepared.",
    synopsis: synopsis || "The full production story for this entry is being prepared. The logline above is the approved public summary for now.",
    categories: project.categories,
    year: project.productionYear,
    status: project.status,
  };
}

function WorkCard({ project, index }: { project: PortfolioProject; index: number }) {
  const artRef = useRef<HTMLDivElement>(null);

  const move = (event: ReactPointerEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const art = artRef.current;
    if (!art) return;
    const rect = event.currentTarget.getBoundingClientRect();
    art.style.setProperty("--px", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
    art.style.setProperty("--py", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
  };

  const reset = () => {
    artRef.current?.style.setProperty("--px", "0");
    artRef.current?.style.setProperty("--py", "0");
  };

  return (
    <article className="portfolio-index-card" onPointerMove={move} onPointerLeave={reset}>
      <div
        className={`portfolio-index-art project-frame--${["amber", "blue", "rose"][index % 3]}`}
        ref={artRef}
      >
        {project.coverImageUrl && (
          <>
            <img
              alt=""
              className="portfolio-index-photo"
              height={900}
              loading="lazy"
              src={project.coverImageUrl}
              width={1600}
            />
            <span className="portfolio-photo-scrim" aria-hidden="true" />
          </>
        )}
        <span className="portfolio-card-number">{project.status === "draft" ? "DRAFT" : "D—TEAM"} / {String(index + 1).padStart(2, "0")}</span>
        <span className="portfolio-card-word">{project.coverImageUrl ? project.title : <>D—T<br />{project.status === "draft" ? "PREVIEW" : "STUDIO"}</>}</span>
        {project.status === "draft" && <span className="portfolio-card-status">DRAFT PREVIEW</span>}
      </div>
      <div className="portfolio-index-meta">
        <div>
          <p className="eyebrow">{project.categories.join(" · ")}</p>
          <h2>{project.title}</h2>
          {project.summary && <p>{project.summary}</p>}
        </div>
        <div className="portfolio-index-actions">
          <StoryOverlay story={storyFor(project)} label="Quick look" className="story-trigger--quiet" />
          <Link href={`/work/${project.slug}`} aria-label={`Open ${project.title}${project.status === "draft" ? " draft preview" : " case study"}`}>
            {project.status === "draft" ? "Preview draft" : "Read case study"} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PortfolioBrowser({ projects }: { projects: PortfolioProject[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("All work");
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleProjects = useMemo(
    () => activeFilter === "All work"
      ? projects
      : projects.filter((project) => project.categories.includes(activeFilter as PortfolioCategory)),
    [activeFilter, projects],
  );

  const selectFilter = (next: Filter) => {
    if (next === activeFilter) return;
    const startViewTransition = (
      document as Document & { startViewTransition?: (callback: () => void) => { finished: Promise<void> } }
    ).startViewTransition;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const grid = gridRef.current;

    if (reduceMotion || typeof startViewTransition !== "function" || !grid) {
      setActiveFilter(next);
      return;
    }

    grid.style.viewTransitionName = "portfolio-grid";
    document.documentElement.classList.add("filtering");
    const transition = startViewTransition.call(document, () => {
      flushSync(() => setActiveFilter(next));
    });
    transition.finished.finally(() => {
      grid.style.viewTransitionName = "";
      document.documentElement.classList.remove("filtering");
    });
  };

  return (
    <>
      <div className="portfolio-filters" role="group" aria-label="Filter projects by category">
        {filters.map((filter) => (
          <button
            type="button"
            className={`portfolio-filter${activeFilter === filter ? " is-active" : ""}`}
            aria-pressed={activeFilter === filter}
            key={filter}
            onClick={() => selectFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <p className="portfolio-result-count" aria-live="polite">{visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}</p>
      <div className="portfolio-index-grid" ref={gridRef}>
        {visibleProjects.map((project, index) => (
          <WorkCard project={project} index={index} key={project.slug} />
        ))}
      </div>
      {visibleProjects.some((project) => project.status === "draft") && <p className="asset-note">Draft entries are previews and are never shown to public visitors in production.</p>}
    </>
  );
}
