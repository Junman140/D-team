import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireStudioAction } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { MAX_MEDIA_BYTES, SUPPORTED_MEDIA_TYPES } from "@/lib/storage/blob";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Media storage is not configured for this deployment." }, { status: 503 });
  }
  let access: Awaited<ReturnType<typeof requireStudioAction>>;
  try {
    access = await requireStudioAction({ media: ["upload"] });
  } catch {
    return Response.json({ error: "You do not have permission to upload media." }, { status: 403 });
  }
  try {
    const body = await request.json() as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!/^media\/[a-f0-9-]{36}\.[a-z0-9]+$/.test(pathname)) throw new Error("Invalid media path.");
        let payload: { projectId?: string; visibility?: string; filename?: string };
        try { payload = JSON.parse(clientPayload || "{}"); } catch { throw new Error("Invalid upload details."); }
        if (payload.projectId) {
          const project = await getPrisma().project.findFirst({ where: { id: payload.projectId, organizationId: access.organizationId }, select: { id: true } });
          if (!project) throw new Error("Choose a project from this workspace.");
        }
        return {
          allowedContentTypes: SUPPORTED_MEDIA_TYPES,
          maximumSizeInBytes: MAX_MEDIA_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ organizationId: access.organizationId, actorUserId: access.session.user.id }),
        };
      },
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: "Could not prepare this upload. Check the file and try again." }, { status: 400 });
  }
}
