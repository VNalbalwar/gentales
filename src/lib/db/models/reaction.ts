import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ReactionType = "like" | "bookmark";

export interface IReaction extends Document {
  storyId: Types.ObjectId;
  userId: Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const ReactionSchema = new Schema<IReaction>(
  {
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["like", "bookmark"],
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* ------------------------------------------------------------------ */
/*  Indexes                                                            */
/* ------------------------------------------------------------------ */

// Prevent duplicate reactions: one like AND one bookmark per user per story
ReactionSchema.index(
  { storyId: 1, userId: 1, type: 1 },
  { unique: true, name: "unique_reaction" }
);

// Fetch all bookmarks for a user's profile
ReactionSchema.index({ userId: 1, type: 1 }, { name: "user_bookmarks" });

/* ------------------------------------------------------------------ */
/*  Model                                                              */
/* ------------------------------------------------------------------ */

export const Reaction: Model<IReaction> =
  mongoose.models.Reaction ||
  mongoose.model<IReaction>("Reaction", ReactionSchema);
