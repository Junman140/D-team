import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "application/pdf": ".pdf",
};

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

export function mediaStorageDirectory() {
  return process.env.MEDIA_STORAGE_DIR
    ? path.resolve(process.env.MEDIA_STORAGE_DIR)
    : path.join(process.cwd(), "var", "media");
}

export async function saveMediaFile(file: File) {
  const extension = allowedTypes[file.type];
  if (!extension) throw new Error("Use a supported image, video, or PDF file.");
  if (file.size < 1 || file.size > MAX_MEDIA_BYTES) throw new Error("Files must be between 1 byte and 50 MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `${randomUUID()}${extension}`;
  const directory = mediaStorageDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ directory, storageKey), buffer, { flag: "wx" });

  return {
    storageKey,
    filename: path.basename(file.name).slice(0, 180) || `upload${extension}`,
    mimeType: file.type,
    byteSize: file.size,
    checksum: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function readMediaFile(storageKey: string) {
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/.test(storageKey)) throw new Error("Invalid media key.");
  return readFile(path.join(/* turbopackIgnore: true */ mediaStorageDirectory(), storageKey));
}

export async function deleteMediaFile(storageKey: string) {
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/.test(storageKey)) return;
  await unlink(path.join(/* turbopackIgnore: true */ mediaStorageDirectory(), storageKey)).catch(() => undefined);
}

async function imageDimensions(filePath: string) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0:s=x",
      filePath,
    ], { timeout: 15_000 });
    const [width, height] = stdout.trim().split("x").map(Number);
    return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null;
  } catch {
    return null;
  }
}

async function writeWebp(input: string, output: string, maxWidth: number) {
  try {
    await execFileAsync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", input,
      "-vf", `scale=min(${maxWidth}\\,iw):-2`,
      "-frames:v", "1",
      "-c:v", "libwebp",
      "-quality", "80",
      output,
    ], { timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

export async function createMediaDerivatives(storageKey: string, mimeType: string) {
  if (!mimeType.startsWith("image/") || mimeType === "image/gif") return null;
  const directory = mediaStorageDirectory();
  const input = path.join(/* turbopackIgnore: true */ directory, storageKey);
  const base = path.parse(storageKey).name;
  const derivativeKey = `${base}-960.webp`;
  const thumbnailKey = `${base}-480.webp`;
  const dimensions = await imageDimensions(input);
  const [hasDerivative, hasThumbnail] = await Promise.all([
    writeWebp(input, path.join(/* turbopackIgnore: true */ directory, derivativeKey), 960),
    writeWebp(input, path.join(/* turbopackIgnore: true */ directory, thumbnailKey), 480),
  ]);
  return {
    derivativeKey: hasDerivative ? derivativeKey : null,
    thumbnailKey: hasThumbnail ? thumbnailKey : null,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  };
}

export async function deleteMediaFiles(storageKeys: Array<string | null | undefined>) {
  await Promise.all(storageKeys.map((storageKey) => storageKey ? deleteMediaFile(storageKey) : Promise.resolve()));
}
