import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { randomUUID } from "crypto";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface IChapter {
  title: string;
  contentMarkdown: string;
  order: number;
}

export interface IGeneration {
  type: "handwritten" | "procedural" | "ai-assisted";
  seed?: string;
  params?: Record<string, unknown>;
  provider?: string;
}

export interface IEmotion {
  hope: number;
  fear: number;
  chaos: number;
  joy: number;
  sadness: number;
}

export interface IThumbnail {
  type: "procedural" | "url";
  url?: string;
  seed?: string;
}

export interface ICounts {
  reads: number;
  likes: number;
  bookmarks: number;
}

export type StoryVisibility = "public" | "private";
export type StoryStatus = "draft" | "published" | "hidden";

export interface IStory extends Document {
  authorId: Types.ObjectId;
  title: string;
  slug: string;
  summary: string;
  contentMarkdown: string;
  chapters: IChapter[];
  generation: IGeneration;
  emotion: IEmotion;
  tags: string[];
  genre: string;
  mood: string;
  visibility: StoryVisibility;
  status: StoryStatus;
  shareToken: string;
  thumbnail: IThumbnail;
  counts: ICounts;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/*  Sub‑schemas                                                        */
/* ------------------------------------------------------------------ */

const ChapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true },
    contentMarkdown: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const GenerationSchema = new Schema<IGeneration>(
  {
    type: {
      type: String,
      enum: ["handwritten", "procedural", "ai-assisted"],
      required: true,
    },
    seed: String,
    params: Schema.Types.Mixed,
    provider: String,
  },
  { _id: false }
);

const EmotionSchema = new Schema<IEmotion>(
  {
    hope: { type: Number, default: 0, min: 0, max: 1 },
    fear: { type: Number, default: 0, min: 0, max: 1 },
    chaos: { type: Number, default: 0, min: 0, max: 1 },
    joy: { type: Number, default: 0, min: 0, max: 1 },
    sadness: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false }
);

const ThumbnailSchema = new Schema<IThumbnail>(
  {
    type: { type: String, enum: ["procedural", "url"], default: "procedural" },
    url: String,
    seed: String,
  },
  { _id: false }
);

const CountsSchema = new Schema<ICounts>(
  {
    reads: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ------------------------------------------------------------------ */
/*  Main Schema                                                        */
/* ------------------------------------------------------------------ */

const StorySchema = new Schema<IStory>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true },
    summary: { type: String, default: "", maxlength: 500 },
    contentMarkdown: { type: String, default: "" },
    chapters: { type: [ChapterSchema], default: [] },
    generation: {
      type: GenerationSchema,
      default: { type: "handwritten" },
    },
    emotion: { type: EmotionSchema, default: {} },
    tags: { type: [String], default: [], index: true },
    genre: { type: String, default: "", index: true },
    mood: { type: String, default: "", index: true },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    shareToken: {
      type: String,
      default: () => randomUUID().replace(/-/g, "").slice(0, 16),
      unique: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "hidden"],
      default: "draft",
    },
    thumbnail: {
      type: ThumbnailSchema,
      default: { type: "procedural" },
    },
    counts: {
      type: CountsSchema,
      default: { reads: 0, likes: 0, bookmarks: 0 },
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/*  Indexes                                                            */
/* ------------------------------------------------------------------ */

// Latest‑feed: public + published, sorted newest first
StorySchema.index(
  { status: 1, visibility: 1, publishedAt: -1 },
  { name: "feed_latest" }
);

// Tag browsing
StorySchema.index({ tags: 1, publishedAt: -1 }, { name: "feed_tags" });

// Full‑text search (MVP – MongoDB native text index)
StorySchema.index(
  { title: "text", contentMarkdown: "text", tags: "text" },
  { name: "text_search", weights: { title: 10, tags: 5, contentMarkdown: 1 } }
);

/* ------------------------------------------------------------------ */
/*  Model                                                              */
/* ------------------------------------------------------------------ */

export const Story: Model<IStory> =
  mongoose.models.Story || mongoose.model<IStory>("Story", StorySchema);
