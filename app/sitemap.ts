import type { MetadataRoute } from "next";
import { listJournalPosts, listTeamMembers } from "@/features/content/queries";
import { listPortfolioEntries } from "@/features/portfolio/queries";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const routes: MetadataRoute.Sitemap = ["", "/work", "/team", "/journal", "/socials"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const [work, team, journal] = await Promise.all([
    listPortfolioEntries(),
    process.env.DATABASE_URL ? listTeamMembers() : Promise.resolve([]),
    process.env.DATABASE_URL ? listJournalPosts() : Promise.resolve([]),
  ]);

  return [
    ...routes,
    ...work.map((entry) => ({ url: `${base}/work/${entry.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...team.map((member) => ({ url: `${base}/team/${member.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...journal.map((post) => ({ url: `${base}/journal/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
