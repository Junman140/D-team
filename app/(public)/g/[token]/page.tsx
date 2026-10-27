import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shared gallery | D-Team Studio", robots: { index: false, follow: false } };

export default async function SharedGalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!process.env.DATABASE_URL) notFound();
  const grant = await getPrisma().shareGrant.findFirst({
    where: {
      token,
      revokedAt: null,
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    },
    include: {
      organization: { select: { name: true } },
      mediaAsset: true,
      gallery: { include: { assets: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!grant || (!grant.gallery && !grant.mediaAsset)) notFound();

  const title = grant.gallery?.title ?? grant.mediaAsset?.filename ?? "Shared media";
  const description = grant.gallery?.description ?? null;
  const assets = grant.gallery
    ? grant.gallery.assets.map((item) => item.mediaAsset)
    : grant.mediaAsset ? [grant.mediaAsset] : [];

  return (
    <main className="shared-gallery section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · PRIVATE SHARE</p>
      <h1>{title}</h1>
      {description && <p className="team-page-intro">{description}</p>}
      <p className="asset-note">Shared by {grant.organization.name}. This link can be revoked or expire. Do not redistribute without permission.</p>
      <div className="gallery-grid">
        {assets.map((asset) => (
          <figure key={asset.id}>
            {asset.mimeType.startsWith("image/") ? (
              <img src={`/api/media/${asset.id}?token=${encodeURIComponent(token)}&size=medium`} alt={asset.filename} loading="lazy" />
            ) : asset.mimeType.startsWith("video/") ? (
              <video controls preload="metadata" aria-label={asset.filename}><source src={`/api/media/${asset.id}?token=${encodeURIComponent(token)}&size=medium`} /></video>
            ) : (
              <a className="file-link" href={`/api/media/${asset.id}?token=${encodeURIComponent(token)}`} target="_blank" rel="noreferrer">Open {asset.filename} ↗</a>
            )}
            <figcaption>{asset.filename}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
