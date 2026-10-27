import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio/", "/delivery/", "/g/", "/request-quote", "/inquiry-received", "/brochure", "/packages", "/services", "/privacy", "/terms"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
