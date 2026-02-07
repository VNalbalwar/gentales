import { z } from "zod";

// ─── Constants ──────────────────────────────────────────────
export const GENRES = [
  "Fantasy",
  "Sci-Fi",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Adventure",
  "Literary Fiction",
  "Historical",
  "Comedy",
  "Drama",
  "Dystopian",
  "Slice of Life",
  "Fable",
  "Mythology",
] as const;

export const MOODS = [
  "Dark",
  "Light",
  "Whimsical",
  "Suspenseful",
  "Romantic",
  "Melancholic",
  "Hopeful",
  "Eerie",
  "Adventurous",
  "Humorous",
  "Reflective",
  "Tense",
] as const;

export const LENGTH_TIERS = [
  "flash",       // ~500 words
  "short",       // ~1500 words
  "medium",      // ~3000 words
  "long",        // ~5000 words
  "novella",     // ~10000 words
] as const;

export type Genre = (typeof GENRES)[number];
export type Mood = (typeof MOODS)[number];
export type LengthTier = (typeof LENGTH_TIERS)[number];

// ─── Story Validators ───────────────────────────────────────

/** Used when autosaving or updating a draft */
export const updateStorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(200_000).optional(),
  summary: z.string().max(1000).optional(),
  genre: z.enum(GENRES).optional(),
  mood: z.enum(MOODS).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  type: z.enum(["human", "ai-generated", "ai-assisted"]).optional(),
  lengthTier: z.enum(LENGTH_TIERS).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

/** Used when publishing a draft — stricter */
export const publishStorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(100).max(200_000),
  summary: z.string().min(10).max(1000),
  genre: z.enum(GENRES),
  tags: z.array(z.string().max(50)).min(1).max(10),
  visibility: z.enum(["public", "private"]).default("public"),
});

/** Used for AI story generation requests */
export const generateStorySchema = z.object({
  genre: z.enum(GENRES),
  mood: z.enum(MOODS).optional(),
  lengthTier: z.enum(LENGTH_TIERS).default("short"),
  prompt: z.string().max(2000).optional(),
  keywords: z.array(z.string().max(100)).max(10).optional(),
});

/** Used when a user reports a story */
export const reportStorySchema = z.object({
  reason: z.enum([
    "spam",
    "harassment",
    "hate-speech",
    "violence",
    "sexual-content",
    "copyright",
    "other",
  ]),
  details: z.string().max(2000).optional(),
});

// ─── Profile Validators ─────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  favoriteGenres: z.array(z.enum(GENRES)).max(5).optional(),
  emailNotifications: z.boolean().optional(),
});

// ─── AI Assist Validator ─────────────────────────────────────

export const assistWritingSchema = z.object({
  action: z.enum(["continue", "rewrite", "suggest", "improve"]),
  content: z.string().min(1).max(100_000),
  instruction: z.string().max(2000).optional(),
  genre: z.enum(GENRES).optional(),
  mood: z.enum(MOODS).optional(),
});
