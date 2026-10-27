"use client";

import { upload } from "@vercel/blob/client";
import { useState, type FormEvent } from "react";
import { discardUnregisteredMediaUpload, finalizeMediaUpload } from "@/app/(studio)/studio/media/actions";

const accepts = "image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime,application/pdf";
const extensions: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif", "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov", "application/pdf": ".pdf" };

export function MediaUploader({ projects }: { projects: Array<{ id: string; name: string }> }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return setError("Choose a file to upload.");
    if (file.size > 50 * 1024 * 1024) return setError("Files must be 50 MB or smaller.");
    setBusy(true);
    setProgress(0);
    let uploadedPathname = "";
    try {
      const extension = extensions[file.type];
      if (!extension) throw new Error("Use a supported image, video, or PDF file.");
      const pathname = `media/${crypto.randomUUID()}${extension}`;
      const payload = JSON.stringify({ projectId: String(form.get("projectId") || ""), visibility: String(form.get("visibility") || "private"), filename: file.name });
      const blob = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/media/upload",
        clientPayload: payload,
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      uploadedPathname = blob.pathname;
      await finalizeMediaUpload({ pathname: blob.pathname, filename: file.name, projectId: String(form.get("projectId") || ""), visibility: String(form.get("visibility") || "private") });
      window.location.assign("/studio/media?uploaded=yes");
    } catch (cause) {
      try {
        if (uploadedPathname) await discardUnregisteredMediaUpload(uploadedPathname);
      } catch { /* The upload can be cleaned up from the media store if the action is unavailable. */ }
      setError(cause instanceof Error ? cause.message : "Upload failed. Please try again.");
      setBusy(false);
      setProgress(null);
    }
  }

  return <form onSubmit={submit} className="cms-form">
    <label className="cms-wide">File <span>Images, video, or PDF · max 50 MB</span><input name="file" type="file" accept={accepts} required disabled={busy} /></label>
    <label>Project<select name="projectId" defaultValue="" disabled={busy}><option value="">Unassigned</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    <label>Visibility<select name="visibility" defaultValue="private" disabled={busy}><option value="private">Private</option><option value="public">Public</option></select></label>
    <button type="submit" disabled={busy}>{busy ? `Uploading ${progress ?? 0}%` : "Upload"}</button>
    {busy && <progress className="cms-wide" max={100} value={progress ?? 0} aria-label="Upload progress" />}
    {error && <p className="form-error cms-wide" role="alert">{error}</p>}
  </form>;
}
