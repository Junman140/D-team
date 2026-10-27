import "server-only";

import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";

export async function canPreviewContent() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session || !membership) return false;
  return hasStudioPermission(membership.organizationId, { content: ["read"] });
}
