import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { createMediaReadUrl } from "@/lib/storage/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) return new Response("Not found", { status: 404 });
  const { id } = await params;
  const prisma = getPrisma();
  const asset = await prisma.mediaAsset.findUnique({ where: { id }, select: { id: true, organizationId: true, storageKey: true, derivativeKey: true, thumbnailKey: true, mimeType: true, byteSize: true, filename: true, visibility: true, projectId: true } });
  if (!asset) return new Response("Not found", { status: 404 });

  let authorized = asset.visibility === "public";
  const token = new URL(request.url).searchParams.get("token");
  if (!authorized && token) {
    const grant = await prisma.shareGrant.findFirst({
      where: {
        token,
        revokedAt: null,
        organizationId: asset.organizationId,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          { OR: [{ mediaAssetId: asset.id }, { gallery: { assets: { some: { mediaAssetId: asset.id } } } }] },
        ],
      },
      select: { id: true },
    });
    authorized = Boolean(grant);
  }
  if (!authorized) {
    const { session, membership } = await getStudioWorkspaceAccess();
    authorized = Boolean(session && membership && membership.organizationId === asset.organizationId && await hasStudioPermission(asset.organizationId, { media: ["read"] }));
  }
  if (!authorized) return new Response("Not found", { status: 404 });

  try {
    const requestedSize = new URL(request.url).searchParams.get("size");
    const storageKey = requestedSize === "thumb" && asset.thumbnailKey
      ? asset.thumbnailKey
      : requestedSize === "medium" && asset.derivativeKey
        ? asset.derivativeKey
        : asset.storageKey;
    const url = await createMediaReadUrl(storageKey);
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
