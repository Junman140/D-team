export function formText(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export function optionalText(formData: FormData, key: string) {
  return formText(formData, key) || null;
}

export function formInt(formData: FormData, key: string, fallback = 0) {
  const raw = formText(formData, key);
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

export function optionalInt(formData: FormData, key: string) {
  const raw = formText(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.trunc(value) : null;
}

export function formDate(formData: FormData, key: string) {
  const raw = formText(formData, key);
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function requireSlug(value: string, label = "URL slug") {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 120) {
    throw new Error(`Use a valid lowercase ${label}.`);
  }
  return value;
}

export function requireText(value: string, label: string, min: number, max: number) {
  if (value.length < min || value.length > max) {
    throw new Error(`${label} must be between ${min} and ${max} characters.`);
  }
  return value;
}

export function optionalTextLimit(value: string | null, label: string, max: number) {
  if (value && value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value;
}

export function parseMediaLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, alt, caption, mediaType] = line.split("|").map((part) => part.trim());
      if (!url) throw new Error("Each media line needs a URL.");
      if (alt.length < 2) throw new Error("Each media line needs alternative text.");
      if (!["image", "video"].includes(mediaType || "image")) throw new Error("Media type must be image or video.");
      if (!(url.startsWith("/") && !url.startsWith("//")) && !/^https:\/\//i.test(url)) {
        throw new Error("Media URLs must use a site path or HTTPS URL.");
      }
      return { url, alt, caption: caption || null, mediaType: mediaType || "image" };
    });
}

export function parseCreditLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [role, name] = line.split("|").map((part) => part.trim());
      if (!role || !name) throw new Error("Each credit line needs a role and a name, separated by |.");
      return { role, name };
    });
}

export function parseListLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
