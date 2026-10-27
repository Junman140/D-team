import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatBytes, formatDate, formatDateTime, toDateTimeLocal } from "@/lib/format";
import { MediaUploader } from "@/components/studio/media-uploader";
import { addGalleryAsset, createGallery, createShareGrant, deleteMediaAsset, removeGalleryAsset, revokeShareGrant, setGalleryPublication, setMediaVisibility } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media | D-Team Production", robots: { index: false, follow: false } };

export default async function MediaPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { media: ["read"] }))) notFound();

  const [canUpload, canUpdate, canDelete, canShare] = await Promise.all([
    hasStudioPermission(membership.organizationId, { media: ["upload"] }),
    hasStudioPermission(membership.organizationId, { media: ["update"] }),
    hasStudioPermission(membership.organizationId, { media: ["delete"] }),
    hasStudioPermission(membership.organizationId, { media: ["share"] }),
  ]);
  const prisma = getPrisma();
  const [assets, galleries, grants, projects] = await Promise.all([
    prisma.mediaAsset.findMany({ where: { organizationId: membership.organizationId }, include: { project: { select: { id: true, name: true } }, _count: { select: { galleryAssets: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.gallery.findMany({
      where: { organizationId: membership.organizationId },
      include: { project: { select: { name: true } }, assets: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } }, shareGrants: { where: { revokedAt: null }, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shareGrant.findMany({ where: { organizationId: membership.organizationId }, include: { gallery: { select: { title: true } }, mediaAsset: { select: { filename: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.project.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · MEDIA</p>
      <h1 className="studio-page-title">Private by default.<br /><em>Shared on purpose.</em></h1>
      <p className="studio-page-intro">Files upload directly to private Vercel Blob storage. Public files are served through the access-controlled media route; share links can expire or be revoked.</p>

      {canUpload && <section className="cms-panel">
        <span className="studio-empty-index">UPLOAD MEDIA</span>
        <h2>Add a file</h2>
        <MediaUploader projects={projects.map(({ id, name }) => ({ id, name }))} />
      </section>}

      <div className="cms-list-heading"><span>MEDIA ASSETS</span><span>{assets.length} TOTAL · {assets.filter((asset) => asset.visibility === "public").length} PUBLIC</span></div>
      {assets.length ? <div className="media-grid">{assets.map((asset) => (
        <article className="media-card" key={asset.id}>
          <div className="media-preview">
            {asset.mimeType.startsWith("image/") ? <img src={`/api/media/${asset.id}?size=thumb`} alt={asset.filename} loading="lazy" /> : <span>{asset.mimeType.startsWith("video/") ? "VIDEO" : asset.mimeType === "application/pdf" ? "PDF" : "FILE"}</span>}
          </div>
          <strong>{asset.filename}</strong>
          <p>{asset.project?.name || "Unassigned"} · {formatBytes(asset.byteSize)} · {asset.visibility}</p>
          <p className="cms-entry-meta">Uploaded {formatDateTime(asset.createdAt)} · {asset._count.galleryAssets} galleries</p>
          <div className="inquiry-actions">
            <a href={`/api/media/${asset.id}`} target="_blank" rel="noreferrer">Open file ↗</a>
            {canUpdate && <form action={setMediaVisibility.bind(null, asset.id, asset.visibility === "public" ? "private" : "public")}><button type="submit">{asset.visibility === "public" ? "Make private" : "Make public"}</button></form>}
            {canShare && <form action={createShareGrant.bind(null, null, asset.id)}><button type="submit">Create share link</button></form>}
            {canDelete && <form action={deleteMediaAsset.bind(null, asset.id)}><button type="submit">Delete</button></form>}
          </div>
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No media yet.</h2><p>Upload approved project files. Media stays private until explicitly shared.</p></div>}

      {canUpload && <section className="cms-panel">
        <span className="studio-empty-index">NEW GALLERY</span>
        <h2>Create a gallery</h2>
        <form action={createGallery} className="cms-form">
          <label>Title<input name="title" required minLength={2} maxLength={160} /></label>
          <label>URL slug <span>(optional)</span><input name="slug" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <label>Project<select name="projectId" defaultValue=""><option value="">Unassigned</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>Visibility<select name="visibility" defaultValue="private"><option value="private">Private</option><option value="public">Public</option></select></label>
          <label className="cms-wide">Description<textarea name="description" maxLength={2000} rows={3} /></label>
          <button type="submit">Create gallery</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>GALLERIES</span><span>{galleries.length} TOTAL</span></div>
      {galleries.length ? <div className="cms-entry-list">{galleries.map((gallery) => (
        <article className="cms-entry" key={gallery.id}>
          <header><div><span className={`cms-status${gallery.status === "published" ? " is-published" : ""}`}>{gallery.status}</span><h2>{gallery.title}</h2><p>{gallery.project?.name || "Unassigned"} · {gallery.visibility} · {gallery.assets.length} assets</p></div>{canShare && <form action={setGalleryPublication.bind(null, gallery.id, gallery.status !== "published")} className="cms-publication-form"><button type="submit">{gallery.status === "published" ? "Unpublish" : "Publish"}</button></form>}</header>
          {gallery.assets.length > 0 && <div className="gallery-strip">{gallery.assets.map((item) => <figure key={item.id}>
            {item.mediaAsset.mimeType.startsWith("image/") ? <img src={`/api/media/${item.mediaAsset.id}?size=thumb`} alt={item.mediaAsset.filename} loading="lazy" /> : <span>{item.mediaAsset.mimeType.startsWith("video/") ? "VIDEO" : "FILE"}</span>}
            <figcaption>{item.mediaAsset.filename}{canUpdate && <form action={removeGalleryAsset.bind(null, gallery.id, item.id)} className="inline-action"><button type="submit">Remove</button></form>}</figcaption>
          </figure>)}</div>}
          {canUpdate && assets.length > 0 && <form action={addGalleryAsset.bind(null, gallery.id)} className="cms-form">
            <label className="cms-wide">Add an asset<select name="mediaAssetId" required defaultValue=""><option value="" disabled>Choose asset</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.filename} — {asset.visibility}</option>)}</select></label>
            <button type="submit">Add to gallery</button>
          </form>}
          {canShare && <details><summary>Share this gallery</summary>
            {gallery.shareGrants.length > 0 && <ul className="studio-mini-list">{gallery.shareGrants.map((grant) => <li key={grant.id}><strong><a href={`/g/${grant.token}`} target="_blank" rel="noreferrer">/g/{grant.token}</a></strong><span>{grant.expiresAt ? `Expires ${formatDateTime(grant.expiresAt)}` : "No expiry"}</span><form action={revokeShareGrant.bind(null, grant.id)} className="inline-action"><button type="submit">Revoke</button></form></li>)}</ul>}
            <form action={createShareGrant.bind(null, gallery.id, null)} className="cms-form">
              <label>Expires <span>(optional)</span><input name="expiresAt" type="datetime-local" /></label>
              <button type="submit">Create share link</button>
            </form>
          </details>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No galleries yet.</h2><p>Group approved media into a gallery, then create an explicit share link.</p></div>}

      <div className="cms-list-heading"><span>SHARE GRANTS</span><span>{grants.length} TOTAL</span></div>
      {grants.length ? <div className="studio-table-wrap"><table className="studio-table">
        <thead><tr><th>Link</th><th>Target</th><th>Created</th><th>Expires</th><th>Status</th><th /></tr></thead>
        <tbody>{grants.map((grant) => <tr key={grant.id}>
          <td><a href={`/g/${grant.token}`} target="_blank" rel="noreferrer">/g/{grant.token}</a></td>
          <td>{grant.gallery?.title || grant.mediaAsset?.filename || "Unknown"}</td>
          <td>{formatDate(grant.createdAt)}</td>
          <td>{grant.expiresAt ? formatDateTime(grant.expiresAt) : "No expiry"}</td>
          <td>{grant.revokedAt ? `Revoked ${formatDate(grant.revokedAt)}` : grant.expiresAt && grant.expiresAt < new Date() ? "Expired" : "Active"}</td>
          <td>{canShare && !grant.revokedAt && <form action={revokeShareGrant.bind(null, grant.id)} className="inline-action"><button type="submit">Revoke</button></form>}</td>
        </tr>)}</tbody>
      </table></div> : <p className="cms-entry-meta">No share links created yet.</p>}
    </>
  );
}
