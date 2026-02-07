import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/**
 * Tracks unique story views. One record per viewer per story per 24h window.
 * Uses a hash of IP + user-agent (or userId if logged in) to identify viewers.
 */
export interface IStoryView extends Document {
  storyId: Types.ObjectId;
  viewerHash: string;
  createdAt: Date;
}

const StoryViewSchema = new Schema<IStoryView>(
  {
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    viewerHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // TTL: auto-delete after 24 hours
    },
  },
  { timestamps: false }
);

// Prevent duplicate views: one per viewer per story
StoryViewSchema.index(
  { storyId: 1, viewerHash: 1 },
  { unique: true, name: "unique_story_view" }
);

export const StoryView: Model<IStoryView> =
  mongoose.models.StoryView ||
  mongoose.model<IStoryView>("StoryView", StoryViewSchema);
