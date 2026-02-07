import slugifyLib from "slugify";

/**
 * Generate a URL‑safe slug with a short random suffix for uniqueness.
 */
export function createSlug(text: string): string {
  const base = slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  }).slice(0, 80);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "story"}-${suffix}`;
}
