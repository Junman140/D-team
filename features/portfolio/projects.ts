export const portfolioCategories = [
  "Film & video",
  "Photography",
  "Live production",
  "Creative & digital",
] as const;

export type PortfolioCategory = (typeof portfolioCategories)[number];

export type PortfolioMediaItem = {
  id?: string;
  mediaType: "image" | "video";
  url: string;
  alt: string;
  caption: string | null;
  sortOrder: number;
};

export type PortfolioCreditItem = {
  id?: string;
  role: string;
  name: string;
  sortOrder: number;
};

export type PortfolioProject = {
  id?: string;
  slug: string;
  title: string;
  categories: PortfolioCategory[];
  status: "draft" | "published";
  summary?: string;
  clientCredit?: string | null;
  productionYear?: number | null;
  brief?: string | null;
  approach?: string | null;
  outcome?: string | null;
  coverImageUrl?: string | null;
  media?: PortfolioMediaItem[];
  credits?: PortfolioCreditItem[];
};

/** Owner-confirmed recent work, published as the site's static portfolio fallback. */
export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "tph-worship-experience",
    title: "TPH Worship Experience",
    categories: ["Live production"],
    status: "published",
    clientCredit: "The Peculiar House Global",
    productionYear: 2026,
    summary: "Camera crew covering the congregation and stage during The Peculiar House Global's worship experience.",
    coverImageUrl: "/media/on-set/cam2-960.webp",
  },
  {
    slug: "kpr-pistis-place-26",
    title: "KPR Pistis Place 26",
    categories: ["Live production", "Film & video"],
    status: "published",
    clientCredit: "thePistisPlace — Kingdom Prayer Retreat 2026",
    productionYear: 2026,
    summary: "Evening-session camera and control-desk coverage of the Kingdom Prayer Retreat 2026.",
    coverImageUrl: "/media/on-set/cam-960.webp",
  },
  {
    slug: "halleluyah-experience-10",
    title: "Halleluyah Experience 10",
    categories: ["Live production", "Photography"],
    status: "published",
    clientCredit: "Zion City Worshippers — 10th anniversary",
    productionYear: 2026,
    summary: "Main camera bank, lighting, and sound coverage for Zion City Worshippers' tenth anniversary.",
    coverImageUrl: "/media/on-set/maincameras-960.webp",
  },
  {
    slug: "living-portals",
    title: "Living Portals",
    categories: ["Live production"],
    status: "published",
    clientCredit: "Living Portals",
    productionYear: 2026,
    summary: "Stage performance coverage behind the Living Portals event programme.",
    coverImageUrl: "/media/site/work4-960.webp",
  },
  {
    slug: "eucharistia",
    title: "Eucharistia",
    categories: ["Photography"],
    status: "published",
    clientCredit: "Eucharistia Night of Worship",
    productionYear: 2026,
    summary: "Event photography against the glowing stage wall of the Eucharistia night of worship.",
    coverImageUrl: "/media/site/church-960.webp",
  },
  {
    slug: "vc-townhall-meeting",
    title: "VC Townhall Meeting",
    categories: ["Photography", "Live production"],
    status: "published",
    clientCredit: "Zion City media unit — school tour",
    productionYear: 2026,
    summary: "Photographer working a decorated hall during the VC Townhall Meeting school tour.",
    coverImageUrl: "/media/site/school-960.webp",
  },
];

export function getPortfolioProject(slug: string) {
  return portfolioProjects.find((project) => project.slug === slug);
}

export const publishedPortfolioProjects = portfolioProjects.filter((project) => project.status === "published");
