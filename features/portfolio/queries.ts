import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import {
  portfolioProjects as staticProjects,
  publishedPortfolioProjects,
  type PortfolioCategory,
  type PortfolioProject,
} from "@/features/portfolio/projects";
import { STUDIO_ORGANIZATION_SLUG } from "@/features/content/queries";

function mapEntry(entry: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categories: string[];
  clientCredit: string | null;
  productionYear: number | null;
  brief: string | null;
  approach: string | null;
  outcome: string | null;
  coverImageUrl: string | null;
  status: string;
  media?: { id: string; mediaType: string; url: string; alt: string; caption: string | null; sortOrder: number }[];
  credits?: { id: string; role: string; name: string; sortOrder: number }[];
}): PortfolioProject {
  return {
    ...entry,
    categories: entry.categories as PortfolioCategory[],
    status: entry.status === "published" ? "published" : "draft",
    media: entry.media?.map((item) => ({
      ...item,
      mediaType: item.mediaType === "video" ? "video" : "image",
    })),
    credits: entry.credits,
  };
}

export async function listPortfolioEntries(options: { includeDrafts?: boolean } = {}): Promise<PortfolioProject[]> {
  if (!process.env.DATABASE_URL) {
    return process.env.NODE_ENV === "development" && options.includeDrafts
      ? staticProjects
      : publishedPortfolioProjects;
  }

  const entries = await getPrisma().portfolioEntry.findMany({
    where: {
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published", publishedAt: { not: null } }),
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      credits: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const cmsProjects = entries.map(mapEntry);
  const publishedCmsProjects = cmsProjects.filter((project) => project.status === "published");
  const publishedSlugs = new Set(publishedCmsProjects.map((project) => project.slug));
  const publishedProjects = [
    ...publishedCmsProjects,
    ...publishedPortfolioProjects.filter((project) => !publishedSlugs.has(project.slug)),
  ];
  if (!options.includeDrafts) return publishedProjects;

  const visibleSlugs = new Set(publishedProjects.map((project) => project.slug));
  return [
    ...publishedProjects,
    ...cmsProjects.filter((project) => project.status === "draft" && !visibleSlugs.has(project.slug)),
  ];
}

export async function getPortfolioEntry(slug: string, options: { includeDrafts?: boolean } = {}): Promise<PortfolioProject | undefined> {
  if (!process.env.DATABASE_URL) {
    const staticProject = staticProjects.find((entry) => entry.slug === slug);
    if (staticProject?.status === "published") return staticProject;
    if (process.env.NODE_ENV !== "development" || !options.includeDrafts) return undefined;
    return staticProject;
  }

  const entry = await getPrisma().portfolioEntry.findFirst({
    where: {
      slug,
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published", publishedAt: { not: null } }),
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      credits: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (entry) {
    const project = mapEntry(entry);
    const staticProject = publishedPortfolioProjects.find((item) => item.slug === slug);
    return project.status === "draft" && staticProject ? staticProject : project;
  }
  return publishedPortfolioProjects.find((project) => project.slug === slug);
}

export async function listRelatedPortfolioEntries(slug: string, limit = 2): Promise<PortfolioProject[]> {
  const entries = await listPortfolioEntries();
  return entries.filter((entry) => entry.slug !== slug).slice(0, limit);
}
