import "server-only";

import { del, get, head, issueSignedToken, presignUrl, put } from "@vercel/blob";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const extensions: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif",
  "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov", "application/pdf": ".pdf",
};
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
export const SUPPORTED_MEDIA_TYPES = Object.keys(extensions);

export function mediaExtension(mimeType: string) { return extensions[mimeType] ?? null; }

export async function deleteMediaFiles(storageKeys: Array<string | null | undefined>) {
  const keys = storageKeys.filter((key): key is string => Boolean(key && key.startsWith("media/") && /^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/.test(key)));
  if (keys.length) await del(keys);
}

export async function createMediaDerivatives(storageKey: string, mimeType: string) {
  if (!mimeType.startsWith("image/") || mimeType === "image/gif") return null;
  const inputBlob = await get(storageKey, { access: "private" });
  if (!inputBlob || inputBlob.statusCode !== 200) return null;
  const directory = await mkdtemp(path.join(os.tmpdir(), "dteam-media-"));
  const input = path.join(directory, "source");
  const base = path.parse(storageKey).name;
  const derivativeKey = `media/${base}-960.webp`;
  const thumbnailKey = `media/${base}-480.webp`;
  try {
    const chunks: Uint8Array[] = [];
    const reader = inputBlob.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    await writeFile(input, Buffer.concat(chunks));
    let width: number | null = null;
    let height: number | null = null;
    try {
      const { stdout } = await execFileAsync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", input], { timeout: 15_000 });
      const values = stdout.trim().split("x").map(Number);
      if (values.every(Number.isFinite)) [width, height] = values;
    } catch { /* Image dimensions are optional metadata. */ }
    const stored: string[] = [];
    for (const [size, key] of [[960, derivativeKey], [480, thumbnailKey]] as const) {
      const output = path.join(directory, `${size}.webp`);
      try {
        await execFileAsync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-vf", `scale=min(${size}\\,iw):-2`, "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", output], { timeout: 30_000 });
        await put(key, await readFile(output), { access: "private", contentType: "image/webp", addRandomSuffix: false, allowOverwrite: true });
        stored.push(key);
      } catch { /* Keep the original available if this image cannot be transformed. */ }
    }
    return { derivativeKey: stored.includes(derivativeKey) ? derivativeKey : null, thumbnailKey: stored.includes(thumbnailKey) ? thumbnailKey : null, width, height };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function getMediaMetadata(pathname: string) { return head(pathname); }

export async function createMediaReadUrl(pathname: string) {
  const validUntil = Date.now() + 5 * 60 * 1000;
  const token = await issueSignedToken({ pathname, operations: ["get"], validUntil });
  const signed = await presignUrl(token, { operation: "get", pathname, validUntil, access: "private" });
  return signed.presignedUrl;
}
