import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import { serviceOfferings } from "@/features/services/services";
import { namedCrewRoster as namedPortraitRoster } from "@/features/content/named-crew-roster";

export const STUDIO_ORGANIZATION_SLUG = "d-team-production";

export type ContentStatus = "draft" | "published";

export type ServiceView = {
  id?: string;
  slug: string;
  name: string;
  discipline: string;
  summary: string;
  description?: string | null;
  status: ContentStatus;
  sortOrder: number;
};

export type PackageView = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  priceLabel: string | null;
  priceAmount: number | null;
  currency: string;
  features: string[];
  status: ContentStatus;
  sortOrder: number;
  serviceId: string | null;
  serviceName?: string | null;
};

export type TeamMemberView = {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  portraitUrl: string | null;
  status: ContentStatus;
  sortOrder: number;
};

export type JournalPostView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  authorName: string | null;
  status: ContentStatus;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type SocialLinkView = {
  id: string;
  platform: string;
  label: string | null;
  url: string;
  status: ContentStatus;
  sortOrder: number;
};

function status(value: string): ContentStatus {
  return value === "published" ? "published" : "draft";
}

export async function listServices(options: { includeDrafts?: boolean } = {}): Promise<ServiceView[]> {
  if (!process.env.DATABASE_URL) {
    return serviceOfferings.map((service, index) => ({ ...service, status: "draft" as const, sortOrder: index }));
  }

  const services = await getPrisma().service.findMany({
    where: {
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published" }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return services.map((service) => ({
    ...service,
    status: status(service.status),
  }));
}

export async function getService(slug: string, options: { includeDrafts?: boolean } = {}): Promise<ServiceView | undefined> {
  if (!process.env.DATABASE_URL) {
    return serviceOfferings.find((service) => service.slug === slug)
      ? { ...serviceOfferings.find((service) => service.slug === slug)!, status: "draft" as const, sortOrder: 0 }
      : undefined;
  }

  const service = await getPrisma().service.findFirst({
    where: {
      slug,
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published" }),
    },
  });
  if (!service) return undefined;
  return { ...service, status: status(service.status) };
}

export async function listPackages(options: { includeDrafts?: boolean } = {}): Promise<PackageView[]> {
  if (!process.env.DATABASE_URL) return [];
  const packages = await getPrisma().servicePackage.findMany({
    where: {
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published" }),
    },
    include: { service: { select: { name: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return packages.map((entry) => ({
    ...entry,
    status: status(entry.status),
    serviceName: entry.service?.name ?? null,
  }));
}

export async function listTeamMembers(options: { includeDrafts?: boolean; includeNamedPortraits?: boolean } = {}): Promise<TeamMemberView[]> {
  if (!process.env.DATABASE_URL) return options.includeNamedPortraits ? namedPortraitRoster : [];
  const members = await getPrisma().teamMember.findMany({
    where: {
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published" }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const cmsMembers = members.map((member) => ({ ...member, status: status(member.status) }));
  if (!options.includeNamedPortraits) return cmsMembers;
  const publishedCms = cmsMembers.filter((member) => member.status === "published");
  const publishedPortraits = namedPortraitRoster.map((portrait) => {
    const member = publishedCms.find((entry) => entry.slug === portrait.slug || entry.name.trim().toLocaleLowerCase() === portrait.name.toLocaleLowerCase());
    return member ? { ...portrait, ...member, portraitUrl: member.portraitUrl || portrait.portraitUrl } : portrait;
  });
  const includedKeys = new Set(publishedPortraits.flatMap((member) => [member.slug, member.name.trim().toLocaleLowerCase()]));
  const mergedPublished = [
    ...publishedCms,
    ...publishedPortraits.filter((portrait) => !publishedCms.some((member) => member.slug === portrait.slug || member.name.trim().toLocaleLowerCase() === portrait.name.toLocaleLowerCase())),
  ];
  if (!options.includeDrafts) return mergedPublished;
  const drafts = cmsMembers.filter((member) =>
    member.status === "draft" && !includedKeys.has(member.slug) && !includedKeys.has(member.name.trim().toLocaleLowerCase()),
  );
  return [...mergedPublished, ...drafts];
}

export async function getTeamMember(slug: string, options: { includeDrafts?: boolean } = {}): Promise<TeamMemberView | undefined> {
  const portrait = namedPortraitRoster.find((member) => member.slug === slug);
  if (!process.env.DATABASE_URL) return portrait;
  const member = await getPrisma().teamMember.findFirst({
    where: {
      slug,
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published" }),
    },
  });
  if (!member) return portrait;
  const view = { ...member, status: status(member.status) };
  return { ...view, portraitUrl: view.portraitUrl || portrait?.portraitUrl || null };
}

export async function listJournalPosts(options: { includeDrafts?: boolean } = {}): Promise<JournalPostView[]> {
  if (!process.env.DATABASE_URL) return [];
  const posts = await getPrisma().journalPost.findMany({
    where: {
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published", publishedAt: { not: null } }),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return posts.map((post) => ({ ...post, status: status(post.status) }));
}

export async function getJournalPost(slug: string, options: { includeDrafts?: boolean } = {}): Promise<JournalPostView | undefined> {
  if (!process.env.DATABASE_URL) return undefined;
  const post = await getPrisma().journalPost.findFirst({
    where: {
      slug,
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published", publishedAt: { not: null } }),
    },
  });
  if (!post) return undefined;
  return { ...post, status: status(post.status) };
}

export async function listSocialLinks(options: { includeDrafts?: boolean } = {}): Promise<SocialLinkView[]> {
  if (!process.env.DATABASE_URL) return [];
  const links = await getPrisma().socialLink.findMany({
    where: {
      organization: { slug: STUDIO_ORGANIZATION_SLUG },
      ...(options.includeDrafts ? {} : { status: "published" }),
    },
    orderBy: [{ sortOrder: "asc" }, { platform: "asc" }],
  });
  return links.map((link) => ({ ...link, status: status(link.status) }));
}

export async function getSiteSetting<T>(key: string): Promise<T | null> {
  if (!process.env.DATABASE_URL) return null;
  const setting = await getPrisma().siteSetting.findFirst({
    where: { key, organization: { slug: STUDIO_ORGANIZATION_SLUG } },
    select: { value: true },
  });
  return (setting?.value as T | undefined) ?? null;
}
